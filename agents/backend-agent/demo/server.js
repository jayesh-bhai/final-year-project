import express from 'express';
import { SentinelWebBackend } from '../src/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize SentinelWeb Backend Agent
const sentinelAgent = new SentinelWebBackend({
  debug: true,
  serverInfo: {
    serverId: 'demo-server-001',
    serverName: 'SentinelWeb Demo Server',
    environment: 'development',
    version: '1.0.0',
    region: 'local'
  }
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add SentinelWeb monitoring middleware
app.use(sentinelAgent.middleware());

// Serve static files for the test interface
app.use(express.static(path.join(__dirname, 'public')));

// Demo routes for testing different scenarios

// 1. Normal API endpoint
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
  });
});

// 2. Login endpoint for authentication testing
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulate different scenarios
  if (username === 'admin' && password === 'password123') {
    sentinelAgent.recordAuthSuccess('admin', req.ip);
    res.json({ success: true, token: 'mock-jwt-token', user: { id: 1, username: 'admin' } });
  } else {
    sentinelAgent.recordAuthFailure(username || 'unknown', req.ip, 'Invalid credentials');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 3. Endpoint that simulates slow response
app.get('/api/slow', async (req, res) => {
  // Simulate slow processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  res.json({ message: 'This was a slow response' });
});

// 4. Endpoint that always returns an error
app.get('/api/error', (req, res) => {
  res.status(500).json({ error: 'Internal server error - this is intentional for testing' });
});

// 5. Search endpoint vulnerable to SQL injection testing
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  // This would trigger security monitoring for SQL injection attempts
  res.json({
    query: query,
    results: [
      { id: 1, title: 'Sample Result 1', description: 'This is a sample search result' },
      { id: 2, title: 'Sample Result 2', description: 'Another sample result' }
    ]
  });
});

// 6. Comment submission endpoint for XSS testing
app.post('/api/comments', (req, res) => {
  const { comment, author } = req.body;
  
  if (!comment || !author) {
    return res.status(400).json({ error: 'Comment and author are required' });
  }
  
  // This would trigger XSS monitoring
  res.json({
    success: true,
    comment: {
      id: Date.now(),
      author: author,
      comment: comment,
      timestamp: new Date().toISOString()
    }
  });
});

// 7. Rate limiting test endpoint
app.get('/api/test-rate-limit', (req, res) => {
  res.json({ message: 'Rate limit test endpoint - make rapid requests to trigger rate limiting' });
});

// 8. File upload endpoint
app.post('/api/upload', (req, res) => {
  // Simulate file upload processing
  res.json({ message: 'File upload processed (simulated)' });
});

// 9. Admin endpoint that might trigger privilege escalation detection
app.get('/api/admin/users', (req, res) => {
  // Check for authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - Bearer token required' });
  }
  
  res.json({
    admin_users: [
      { id: 1, username: 'admin', role: 'administrator', lastLogin: '2024-01-15T10:30:00Z' },
      { id: 2, username: 'moderator', role: 'moderator', lastLogin: '2024-01-14T15:45:00Z' }
    ]
  });
});

// 10. Dashboard metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = sentinelAgent.getMetrics();
  res.json(metrics);
});

// 11. Agent control endpoints
app.post('/api/agent/start', (req, res) => {
  sentinelAgent.start();
  res.json({ success: true, message: 'SentinelWeb agent started' });
});

app.post('/api/agent/stop', (req, res) => {
  sentinelAgent.stop();
  res.json({ success: true, message: 'SentinelWeb agent stopped' });
});

app.post('/api/agent/reset', (req, res) => {
  sentinelAgent.reset();
  res.json({ success: true, message: 'SentinelWeb agent metrics reset' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    sentinelAgent: {
      sessionId: sentinelAgent.sessionId,
      serverId: sentinelAgent.serverId,
      isRunning: sentinelAgent.isRunning
    }
  });
});

// Catch-all route for testing 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 SentinelWeb Backend Demo Server`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`\n🛡️ SentinelWeb Backend Agent Status:`);
  console.log(`📋 Session ID: ${sentinelAgent.sessionId}`);
  console.log(`🖥️  Server ID: ${sentinelAgent.serverId}`);
  console.log(`\n🧪 Test endpoints available:`);
  console.log(`   GET  /api/users - Normal API`);
  console.log(`   POST /api/login - Authentication (admin/password123)`);
  console.log(`   GET  /api/slow - Slow response test`);
  console.log(`   GET  /api/error - Error test`);
  console.log(`   GET  /api/search?query=test - SQL injection test`);
  console.log(`   POST /api/comments - XSS test`);
  console.log(`   GET  /api/test-rate-limit - Rate limiting test`);
  console.log(`   GET  /api/admin/users - Authorization test`);
  console.log(`\n⚡ Agent controls:`);
  console.log(`   POST /api/agent/start - Start monitoring`);
  console.log(`   POST /api/agent/stop - Stop monitoring`);
  console.log(`   POST /api/agent/reset - Reset metrics`);
  
  // Start the SentinelWeb agent
  sentinelAgent.start();
  console.log(`\n🟢 SentinelWeb Backend Agent is now monitoring!`);
  console.log(`📤 Sending data to: ${sentinelAgent.config.getConfig().apiEndpoint}`);
});