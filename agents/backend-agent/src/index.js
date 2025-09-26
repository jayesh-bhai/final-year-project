import express from 'express';
import { BackendConfigManager } from './config.js';
import { BackendUtils } from './utils.js';

export class SentinelWebBackend {
  constructor(userConfig = {}) {
    this.config = new BackendConfigManager(userConfig);
    this.sessionId = BackendUtils.generateSessionId();
    this.serverId = BackendUtils.generateServerId();
    this.startTime = Date.now();
    this.isRunning = false;
    
    // Metrics storage
    this.authMetrics = {
      totalLoginAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      blockedIPs: [],
      suspiciousLogins: [],
      passwordResetRequests: 0,
      newUserRegistrations: 0
    };
    
    this.apiMetrics = {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByEndpoint: {},
      responseTimeAvg: 0,
      responseTimeP95: 0,
      responseTimeP99: 0,
      errorRate: 0,
      statusCodes: {},
      unusualEndpoints: [],
      rateLimitHits: 0
    };
    
    this.securityEvents = [];
    this.errorEvents = [];
    this.responseTimes = [];
    this.requestCounts = new Map();
    
    console.log('🛡️ SentinelWeb Backend Agent initialized');
    console.log('📊 Session ID:', this.sessionId);
    console.log('🖥️ Server ID:', this.serverId);
  }

  /**
   * Express middleware for request monitoring
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const ip = BackendUtils.getClientIP(req);
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // Track request metrics
      this.trackRequest(req, ip, userAgent);
      
      // Monitor for security threats
      this.monitorSecurity(req, ip, userAgent);
      
      // Override res.end to capture response metrics
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.trackResponse(req, res, responseTime, ip);
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }

  /**
   * Track incoming requests
   */
  trackRequest(req, ip, userAgent) {
    this.apiMetrics.totalRequests++;
    
    // Track by method
    const method = req.method;
    this.apiMetrics.requestsByMethod[method] = (this.apiMetrics.requestsByMethod[method] || 0) + 1;
    
    // Track by endpoint
    const endpoint = req.path;
    this.apiMetrics.requestsByEndpoint[endpoint] = (this.apiMetrics.requestsByEndpoint[endpoint] || 0) + 1;
    
    // Check for rate limiting
    this.checkRateLimit(ip);
    
    // Check for suspicious user agents
    if (BackendUtils.isSuspiciousUserAgent(userAgent)) {
      this.addSecurityEvent('suspicious_user_agent', 'medium', 
        'Suspicious user agent detected', ip, userAgent, endpoint);
    }
    
    // Check for unusual HTTP methods
    if (['TRACE', 'CONNECT', 'PATCH'].includes(method)) {
      this.addSecurityEvent('unusual_api_access', 'low',
        `Unusual HTTP method: ${method}`, ip, userAgent, endpoint);
    }
  }

  /**
   * Track responses
   */
  trackResponse(req, res, responseTime, ip) {
    // Track response times
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift(); // Keep only last 1000 measurements
    }
    
    // Track status codes
    const statusCode = res.statusCode.toString();
    this.apiMetrics.statusCodes[statusCode] = (this.apiMetrics.statusCodes[statusCode] || 0) + 1;
    
    // Track slow responses
    const slowThreshold = this.config.getPerformanceConfig().slowResponseThreshold;
    if (responseTime > slowThreshold) {
      this.addSecurityEvent('performance_issue', 'low',
        `Slow response: ${responseTime}ms`, ip, req.get('User-Agent'), req.path);
    }
    
    // Track errors
    if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
      this.addErrorEvent('http', `HTTP ${statusCode}`, req.path, req.method, parseInt(statusCode), ip);
    }
  }

  /**
   * Monitor for security threats
   */
  monitorSecurity(req, ip, userAgent) {
    // Check query parameters for SQL injection
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && BackendUtils.isSuspiciousQuery(value)) {
          this.addSecurityEvent('sql_injection_attempt', 'high',
            `SQL injection pattern in query parameter: ${key}`, ip, userAgent, req.path);
        }
      }
    }
    
    // Check request body for XSS
    if (req.body) {
      const bodyStr = JSON.stringify(req.body);
      if (BackendUtils.containsXSS(bodyStr)) {
        this.addSecurityEvent('xss_attempt', 'high',
          'XSS pattern detected in request body', ip, userAgent, req.path);
      }
    }
    
    // Check for authentication endpoints
    if (req.path.includes('login') || req.path.includes('auth')) {
      this.authMetrics.totalLoginAttempts++;
    }
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(ip) {
    const maxRequests = 100; // 100 requests per minute
    const timeWindow = 60000; // 1 minute
    
    if (BackendUtils.isRateLimited(ip, this.requestCounts, maxRequests, timeWindow)) {
      this.apiMetrics.rateLimitHits++;
      this.addSecurityEvent('rate_limit_exceeded', 'medium',
        'Rate limit exceeded', ip, 'unknown', 'multiple');
    }
  }

  /**
   * Add security event
   */
  addSecurityEvent(type, severity, description, ip, userAgent, endpoint) {
    const event = {
      type,
      severity,
      description,
      timestamp: Date.now(),
      ip,
      userAgent,
      endpoint,
      metadata: {}
    };
    
    this.securityEvents.push(event);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }
    
    if (this.config.getConfig().debug) {
      console.log(`🚨 Security Event: ${type} (${severity}) - ${description}`);
    }
  }

  /**
   * Add error event
   */
  addErrorEvent(type, message, endpoint, method, statusCode, ip) {
    const event = {
      type,
      message,
      endpoint,
      method,
      statusCode,
      timestamp: Date.now(),
      ip,
      stack: ''
    };
    
    this.errorEvents.push(event);
    
    // Keep only last 50 errors
    if (this.errorEvents.length > 50) {
      this.errorEvents.shift();
    }
  }

  /**
   * Record authentication success
   */
  recordAuthSuccess(userId, ip) {
    this.authMetrics.successfulLogins++;
    if (this.config.getConfig().debug) {
      console.log(`✅ Successful login: User ${userId} from ${ip}`);
    }
  }

  /**
   * Record authentication failure
   */
  recordAuthFailure(username, ip, reason) {
    this.authMetrics.failedLogins++;
    
    // Track suspicious login
    this.authMetrics.suspiciousLogins.push({
      ip,
      userAgent: 'unknown',
      timestamp: Date.now(),
      reason,
      username
    });
    
    this.addSecurityEvent('brute_force_attempt', 'high',
      `Failed login attempt: ${reason}`, ip, 'unknown', '/login');
    
    if (this.config.getConfig().debug) {
      console.log(`❌ Failed login: ${username} from ${ip} - ${reason}`);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    // Calculate performance metrics
    const avgResponseTime = this.responseTimes.length > 0 ?
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length : 0;
    
    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    return {
      sessionId: this.sessionId,
      serverId: this.serverId,
      timestamp: Date.now(),
      serverInfo: this.config.getServerInfo(),
      authenticationMetrics: this.authMetrics,
      apiMetrics: {
        ...this.apiMetrics,
        responseTimeAvg: Math.round(avgResponseTime),
        responseTimeP95: sortedTimes[p95Index] || 0,
        responseTimeP99: sortedTimes[p99Index] || 0,
        errorRate: this.apiMetrics.totalRequests > 0 ?
          (this.errorEvents.length / this.apiMetrics.totalRequests) * 100 : 0
      },
      securityEvents: [...this.securityEvents],
      errorEvents: [...this.errorEvents],
      performanceMetrics: {
        responseTime: {
          average: Math.round(avgResponseTime),
          median: sortedTimes[Math.floor(sortedTimes.length / 2)] || 0,
          p95: sortedTimes[p95Index] || 0,
          p99: sortedTimes[p99Index] || 0
        },
        systemUsage: BackendUtils.getMemoryUsage()
      },
      systemMetrics: {
        uptime: Date.now() - this.startTime,
        memoryInfo: BackendUtils.getMemoryUsage()
      }
    };
  }

  /**
   * Start periodic data collection
   */
  start() {
    if (this.isRunning) {
      console.warn('Backend agent is already running');
      return;
    }
    
    this.isRunning = true;
    const configData = this.config.getConfig();
    
    console.log('🚀 Starting SentinelWeb Backend Agent');
    
    // Start periodic data collection
    this.collectionInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      try {
        const metrics = this.getMetrics();
        this.sendMetrics(metrics);
      } catch (error) {
        console.error('Error collecting backend metrics:', error);
      }
    }, configData.collectInterval);
  }

  /**
   * Stop the agent
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
    
    console.log('🛑 SentinelWeb Backend Agent stopped');
  }

  /**
   * Send metrics to collector API
   */
  async sendMetrics(metrics) {
    const configData = this.config.getConfig();
    
    try {
      const response = await fetch(configData.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(configData.apiKey && { 'Authorization': `Bearer ${configData.apiKey}` })
        },
        body: JSON.stringify(metrics)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (configData.debug) {
        console.log('📊 Backend metrics sent successfully');
      }
    } catch (error) {
      if (configData.debug) {
        console.error('Failed to send backend metrics:', error.message);
      }
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.authMetrics = {
      totalLoginAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
      blockedIPs: [],
      suspiciousLogins: [],
      passwordResetRequests: 0,
      newUserRegistrations: 0
    };
    
    this.apiMetrics = {
      totalRequests: 0,
      requestsByMethod: {},
      requestsByEndpoint: {},
      responseTimeAvg: 0,
      responseTimeP95: 0,
      responseTimeP99: 0,
      errorRate: 0,
      statusCodes: {},
      unusualEndpoints: [],
      rateLimitHits: 0
    };
    
    this.securityEvents = [];
    this.errorEvents = [];
    this.responseTimes = [];
    this.requestCounts.clear();
    
    this.sessionId = BackendUtils.generateSessionId();
    this.startTime = Date.now();
    
    console.log('🔄 Backend agent metrics reset');
  }
}

export default SentinelWebBackend;