import express from 'express';
import bodyParser from 'body-parser';

const app = express();

// Statistics tracking
const stats = {
  startTime: Date.now(),
  requests: {
    frontend: { count: 0, lastReceived: null },
    backend: { count: 0, lastReceived: null },
    total: 0
  },
  agents: {
    frontend: new Set(),
    backend: new Set()
  }
};

// Helper functions for data formatting
function getSeverityIcon(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return seconds + 's';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ' + (seconds % 60) + 's';
  const hours = Math.floor(minutes / 60);
  return hours + 'h ' + (minutes % 60) + 'm';
}

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = Date.now() - stats.startTime;
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: formatDuration(uptime),
    stats: {
      totalRequests: stats.requests.total,
      frontendAgents: {
        requests: stats.requests.frontend.count,
        activeAgents: stats.agents.frontend.size,
        lastReceived: stats.requests.frontend.lastReceived
      },
      backendAgents: {
        requests: stats.requests.backend.count,
        activeAgents: stats.agents.backend.size,
        lastReceived: stats.requests.backend.lastReceived
      }
    }
  });
});

// Endpoint for frontend agent
app.post("/api/collect/frontend", (req, res) => {
  // Update statistics
  stats.requests.frontend.count++;
  stats.requests.frontend.lastReceived = new Date().toISOString();
  stats.requests.total++;
  if (req.body.sessionId) {
    stats.agents.frontend.add(req.body.sessionId);
  }
  
  console.log("\n🔍 Frontend Agent Data Received:");
  console.log("📊 Session ID:", req.body.sessionId);
  console.log("🌐 URL:", req.body.url);
  console.log("⏱️  Session Duration:", formatDuration(req.body.sessionDuration));
  console.log("📱 User Agent:", req.body.userAgent?.substring(0, 80) + (req.body.userAgent?.length > 80 ? '...' : ''));
  
  if (req.body.userBehavior) {
    console.log("🖱️  User Behavior:", {
      mouseClicks: req.body.userBehavior.mouseClicks,
      keystrokes: req.body.userBehavior.keystrokes,
      scrollEvents: req.body.userBehavior.scrollEvents,
      formInteractions: req.body.userBehavior.formInteractions,
      idleTime: formatDuration(req.body.userBehavior.idleTime),
      mouseMovements: req.body.userBehavior.mouseMovements?.length || 0,
      clickPattern: req.body.userBehavior.clickPattern?.length || 0
    });
  }
  
  if (req.body.securityEvents && Array.isArray(req.body.securityEvents) && req.body.securityEvents.length > 0) {
    console.log("🚨 Security Events:", req.body.securityEvents.length);
    req.body.securityEvents.forEach((event, index) => {
      const severity = event.severity?.toUpperCase() || 'UNKNOWN';
      const severityIcon = getSeverityIcon(event.severity);
      console.log(`  ${index + 1}. ${severityIcon} ${event.type} (${severity}): ${event.description}`);
      if (event.metadata) {
        const meta = Object.entries(event.metadata)
          .filter(([key, value]) => value && key !== 'timestamp')
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        if (meta) console.log(`     ${meta}`);
      }
    });
  } else if (req.body.securityEvents && req.body.securityEvents !== '[REDACTED]') {
    console.log("🚨 Security Events: (sanitized data)");
  }
  
  if (req.body.errorEvents && Array.isArray(req.body.errorEvents) && req.body.errorEvents.length > 0) {
    console.log("❌ Error Events:", req.body.errorEvents.length);
    req.body.errorEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type}: ${event.message}`);
      if (event.source) {
        console.log(`     Source: ${event.source}:${event.line}:${event.column}`);
      }
    });
  }
  
  if (req.body.networkEvents && Array.isArray(req.body.networkEvents) && req.body.networkEvents.length > 0) {
    console.log("🌐 Network Events:", req.body.networkEvents.length);
    
    // Show slow requests
    const slowRequests = req.body.networkEvents.filter(event => event.responseTime > 1000);
    if (slowRequests.length > 0) {
      console.log(`  🐌 Slow Requests (>1s):`);
      slowRequests.slice(0, 3).forEach((event, index) => {
        console.log(`    ${index + 1}. ${event.method} ${event.url} - ${event.responseTime}ms`);
      });
    }
    
    // Show failed requests
    const failedRequests = req.body.networkEvents.filter(event => event.status >= 400);
    if (failedRequests.length > 0) {
      console.log(`  ❌ Failed Requests (4xx/5xx):`);
      failedRequests.slice(0, 3).forEach((event, index) => {
        console.log(`    ${index + 1}. ${event.method} ${event.url} - Status ${event.status}`);
      });
    }
  }
  
  if (req.body.performanceMetrics) {
    console.log("⚡ Performance:", {
      memoryUsage: (req.body.performanceMetrics.memoryUsage * 100).toFixed(2) + '%',
      networkLatency: req.body.performanceMetrics.networkLatency + 'ms',
      renderTime: req.body.performanceMetrics.renderTime?.toFixed(2) + 'ms',
      jsExecutionTime: req.body.performanceMetrics.jsExecutionTime?.toFixed(2) + 'ms'
    });
  }
  
  if (req.body.pageMetrics) {
    console.log("📈 Page Metrics:", {
      loadTime: req.body.pageMetrics.loadTime + 'ms',
      domContentLoaded: req.body.pageMetrics.domContentLoaded + 'ms',
      firstContentfulPaint: req.body.pageMetrics.firstContentfulPaint + 'ms',
      largestContentfulPaint: req.body.pageMetrics.largestContentfulPaint + 'ms'
    });
  }
  
  console.log("\n" + "=".repeat(60));
  
  res.status(200).json({ 
    status: "success", 
    message: "Frontend data received and processed",
    timestamp: new Date().toISOString(),
    sessionId: req.body.sessionId,
    dataPoints: {
      userBehavior: !!req.body.userBehavior,
      securityEvents: req.body.securityEvents?.length || 0,
      errorEvents: req.body.errorEvents?.length || 0,
      networkEvents: req.body.networkEvents?.length || 0,
      performanceMetrics: !!req.body.performanceMetrics
    }
  });
});

// Endpoint for backend agent
app.post("/api/collect/backend", (req, res) => {
  // Update statistics
  stats.requests.backend.count++;
  stats.requests.backend.lastReceived = new Date().toISOString();
  stats.requests.total++;
  if (req.body.serverId) {
    stats.agents.backend.add(req.body.serverId);
  }
  
  console.log("\n🖥️  Backend Agent Data Received:");
  console.log("📊 Session ID:", req.body.sessionId);
  console.log("🖥️  Server ID:", req.body.serverId);
  console.log("⏱️  Timestamp:", new Date(req.body.timestamp).toLocaleString());
  
  if (req.body.serverInfo) {
    console.log("ℹ️  Server Info:", {
      serverName: req.body.serverInfo.serverName,
      environment: req.body.serverInfo.environment,
      version: req.body.serverInfo.version,
      region: req.body.serverInfo.region || 'N/A'
    });
  }
  
  if (req.body.authenticationMetrics) {
    const auth = req.body.authenticationMetrics;
    console.log("🔐 Authentication Metrics:", {
      totalLoginAttempts: auth.totalLoginAttempts,
      successfulLogins: auth.successfulLogins,
      failedLogins: auth.failedLogins,
      blockedIPs: auth.blockedIPs?.length || 0,
      suspiciousLogins: auth.suspiciousLogins?.length || 0,
      passwordResetRequests: auth.passwordResetRequests,
      newUserRegistrations: auth.newUserRegistrations
    });
    
    // Show recent suspicious logins
    if (auth.suspiciousLogins && auth.suspiciousLogins.length > 0) {
      console.log("🚨 Recent Suspicious Logins:");
      auth.suspiciousLogins.slice(-3).forEach((login, index) => {
        console.log(`  ${index + 1}. IP: ${login.ip} | Reason: ${login.reason} | User: ${login.username || 'unknown'}`);
      });
    }
  }
  
  if (req.body.apiMetrics) {
    const api = req.body.apiMetrics;
    console.log("📈 API Metrics:", {
      totalRequests: api.totalRequests,
      avgResponseTime: api.responseTimeAvg + 'ms',
      errorRate: api.errorRate?.toFixed(2) + '%',
      rateLimitHits: api.rateLimitHits
    });
    
    // Show top endpoints by request count
    if (api.requestsByEndpoint) {
      const topEndpoints = Object.entries(api.requestsByEndpoint)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      if (topEndpoints.length > 0) {
        console.log("🔥 Top Endpoints:");
        topEndpoints.forEach(([endpoint, count], index) => {
          console.log(`  ${index + 1}. ${endpoint}: ${count} requests`);
        });
      }
    }
    
    // Show HTTP status distribution
    if (api.statusCodes) {
      const statusEntries = Object.entries(api.statusCodes);
      if (statusEntries.length > 0) {
        console.log("📊 Status Codes:", api.statusCodes);
      }
    }
  }
  
  if (req.body.securityEvents && Array.isArray(req.body.securityEvents) && req.body.securityEvents.length > 0) {
    console.log("🚨 Security Events:", req.body.securityEvents.length);
    req.body.securityEvents.forEach((event, index) => {
      const severity = event.severity?.toUpperCase() || 'UNKNOWN';
      const severityIcon = getSeverityIcon(event.severity);
      console.log(`  ${index + 1}. ${severityIcon} ${event.type} (${severity}): ${event.description}`);
      if (event.ip) {
        console.log(`     IP: ${event.ip} | Endpoint: ${event.endpoint || 'N/A'}`);
      }
    });
  } else if (req.body.securityEvents && req.body.securityEvents !== '[REDACTED]') {
    console.log("🚨 Security Events: (sanitized data)");
  }
  
  if (req.body.errorEvents && Array.isArray(req.body.errorEvents) && req.body.errorEvents.length > 0) {
    console.log("❌ Error Events:", req.body.errorEvents.length);
    req.body.errorEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type}: ${event.message}`);
      if (event.endpoint) {
        console.log(`     ${event.method || 'N/A'} ${event.endpoint} | Status: ${event.statusCode || 'N/A'}`);
      }
    });
  }
  
  if (req.body.performanceMetrics) {
    const perf = req.body.performanceMetrics;
    console.log("⚡ Performance Metrics:");
    
    if (perf.responseTime) {
      console.log(`  📊 Response Times: Avg ${perf.responseTime.average}ms | P95 ${perf.responseTime.p95}ms | P99 ${perf.responseTime.p99}ms`);
    }
    
    if (perf.systemUsage) {
      const memoryPercent = perf.systemUsage.systemUsagePercentage?.toFixed(2) || 'N/A';
      console.log(`  💾 Memory Usage: ${memoryPercent}% | Heap Used: ${formatBytes(perf.systemUsage.heapUsed || 0)}`);
    }
  }
  
  if (req.body.systemMetrics) {
    const system = req.body.systemMetrics;
    const uptimeHours = (system.uptime / (1000 * 60 * 60)).toFixed(2);
    console.log(`⏰ System Uptime: ${uptimeHours} hours`);
  }
  
  console.log("\n" + "=".repeat(60));
  
  res.status(200).json({ 
    status: "success", 
    message: "Backend data received and processed",
    timestamp: new Date().toISOString(),
    sessionId: req.body.sessionId,
    serverId: req.body.serverId,
    dataPoints: {
      authMetrics: !!req.body.authenticationMetrics,
      apiMetrics: !!req.body.apiMetrics,
      securityEvents: req.body.securityEvents?.length || 0,
      errorEvents: req.body.errorEvents?.length || 0,
      performanceMetrics: !!req.body.performanceMetrics
    }
  });
});

// Statistics endpoint
app.get('/api/stats', (req, res) => {
  const uptime = Date.now() - stats.startTime;
  res.status(200).json({
    collector: {
      uptime: formatDuration(uptime),
      startTime: new Date(stats.startTime).toISOString()
    },
    requests: {
      total: stats.requests.total,
      frontend: {
        count: stats.requests.frontend.count,
        lastReceived: stats.requests.frontend.lastReceived,
        activeAgents: stats.agents.frontend.size
      },
      backend: {
        count: stats.requests.backend.count,
        lastReceived: stats.requests.backend.lastReceived,
        activeAgents: stats.agents.backend.size
      }
    },
    agents: {
      frontend: {
        total: stats.agents.frontend.size,
        sessions: Array.from(stats.agents.frontend)
      },
      backend: {
        total: stats.agents.backend.size,
        servers: Array.from(stats.agents.backend)
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 SentinelWeb Collector API v2.0`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`\n📊 Available Endpoints:`);
  console.log(`  🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`  📊 Statistics: http://localhost:${PORT}/api/stats`);
  console.log(`  📊 Frontend endpoint: http://localhost:${PORT}/api/collect/frontend`);
  console.log(`  🖥️  Backend endpoint: http://localhost:${PORT}/api/collect/backend`);
  console.log(`\n🔍 Enhanced Features:`);
  console.log(`  ✅ Rich data formatting with color-coded severity levels`);
  console.log(`  ✅ Detailed performance metrics and system usage`);
  console.log(`  ✅ Real-time agent statistics and tracking`);
  console.log(`  ✅ Comprehensive security event analysis`);
  console.log(`  ✅ Network and error event monitoring`);
  console.log(`\n⏳ Ready to receive agent data...\n`);
});
