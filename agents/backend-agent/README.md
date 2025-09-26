# 🛡️ SentinelWeb Backend Agent

The SentinelWeb Backend Agent is a comprehensive Node.js/Express middleware for real-time server-side security monitoring, performance tracking, and threat detection. It provides intelligent monitoring of API requests, authentication events, database queries, and system metrics with built-in security event detection.

## ✨ Features

### 🔍 **Comprehensive Server Monitoring**
- **API Request Tracking**: Method, endpoint, response time, status code monitoring
- **Authentication Monitoring**: Login attempts, failures, suspicious patterns
- **Security Event Detection**: SQL injection, XSS, brute force, rate limiting
- **Performance Monitoring**: Response times, memory usage, slow queries
- **Error Tracking**: HTTP errors, application errors, stack traces
- **System Metrics**: Memory, CPU, disk usage, network statistics

### 🔒 **Advanced Security Features**
- **Threat Detection**: Real-time analysis of malicious patterns
- **Rate Limiting**: Configurable request limiting per IP
- **Suspicious IP Tracking**: Automatic flagging of unusual access patterns
- **User Agent Analysis**: Bot and scraper detection
- **Privilege Escalation Detection**: Unauthorized access attempts
- **Data Exfiltration Monitoring**: Unusual data access patterns

### ⚡ **High Performance**
- **Minimal Overhead**: <2% performance impact on server requests
- **Non-blocking**: Asynchronous monitoring and data collection
- **Memory Efficient**: Automatic cleanup of old metrics
- **Configurable**: Adjustable thresholds and monitoring levels

## 🚀 Quick Start

### Installation

```bash
npm install @sentinelweb/backend-agent
```

### Basic Express Integration

```javascript
import express from 'express';
import { SentinelWebBackend } from '@sentinelweb/backend-agent';

const app = express();

// Initialize SentinelWeb Backend Agent
const sentinelAgent = new SentinelWebBackend({
  apiEndpoint: 'https://your-api.com/collect/backend',
  debug: true,
  serverInfo: {
    serverId: 'prod-server-001',
    serverName: 'Production API Server',
    environment: 'production',
    version: '2.1.0'
  }
});

// Add monitoring middleware (should be early in middleware chain)
app.use(sentinelAgent.middleware());

// Your regular middleware and routes
app.use(express.json());

// Example route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (authenticate(username, password)) {
    sentinelAgent.recordAuthSuccess(username, req.ip);
    res.json({ success: true, token: generateToken(username) });
  } else {
    sentinelAgent.recordAuthFailure(username, req.ip, 'Invalid credentials');
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Start monitoring
sentinelAgent.start();

app.listen(3000, () => {
  console.log('Server running with SentinelWeb protection');
});
```

### Advanced Configuration

```javascript
const sentinelAgent = new SentinelWebBackend({
  apiEndpoint: 'https://your-api.com/collect/backend',
  apiKey: 'your-api-key',
  collectInterval: 30000, // 30 seconds
  enabledFeatures: {
    authenticationMonitoring: true,
    apiRequestTracking: true,
    databaseMonitoring: true,
    errorTracking: true,
    performanceMonitoring: true,
    securityEventDetection: true,
    fileUploadMonitoring: true,
    rateLimitingMonitoring: true
  },
  security: {
    enableBruteForceDetection: true,
    enableSQLInjectionDetection: true,
    enableXSSDetection: true,
    suspiciousIPTracking: true,
    maxFailedAttempts: 5,
    bruteForceTimeWindow: 15 // minutes
  },
  performance: {
    slowQueryThreshold: 1000, // 1 second
    slowResponseThreshold: 2000, // 2 seconds
    highMemoryThreshold: 80, // 80%
    highCPUThreshold: 80 // 80%
  },
  debug: false,
  serverInfo: {
    serverId: 'prod-api-01',
    serverName: 'Production API Server',
    environment: 'production',
    version: '2.1.0',
    region: 'us-east-1'
  }
});
```

## 📊 Data Collection

### Authentication Metrics
```javascript
{
  totalLoginAttempts: 150,
  successfulLogins: 142,
  failedLogins: 8,
  blockedIPs: ['192.168.1.100'],
  suspiciousLogins: [
    {
      ip: '10.0.0.50',
      userAgent: 'curl/7.68.0',
      timestamp: 1645123456789,
      reason: 'Multiple failed attempts',
      username: 'admin'
    }
  ],
  passwordResetRequests: 3,
  newUserRegistrations: 12
}
```

### API Metrics
```javascript
{
  totalRequests: 5420,
  requestsByMethod: {
    GET: 3200,
    POST: 1800,
    PUT: 300,
    DELETE: 120
  },
  requestsByEndpoint: {
    '/api/users': 1200,
    '/api/auth/login': 450,
    '/api/products': 890
  },
  responseTimeAvg: 245,
  responseTimeP95: 850,
  responseTimeP99: 1200,
  errorRate: 2.3,
  statusCodes: {
    '200': 4800,
    '400': 120,
    '401': 80,
    '500': 20
  },
  rateLimitHits: 15
}
```

### Security Events
```javascript
{
  type: 'sql_injection_attempt',
  severity: 'high',
  description: 'SQL injection pattern in query parameter: search',
  timestamp: 1645123456789,
  ip: '203.0.113.100',
  userAgent: 'Mozilla/5.0...',
  endpoint: '/api/search',
  metadata: {
    parameter: 'search',
    value: \"'; DROP TABLE users; --\",
    blocked: true
  }
}
```

## 🛠️ API Reference

### Core Methods

#### `middleware(): function`
Returns Express middleware function for request monitoring.

#### `start(): void`
Starts the monitoring agent and begins periodic data collection.

#### `stop(): void`
Stops the agent and cleans up resources.

#### `getMetrics(): object`
Returns current metrics snapshot.

#### `reset(): void`
Resets all collected metrics and generates new session ID.

### Authentication Tracking

#### `recordAuthSuccess(userId, ip): void`
Records successful authentication event.

#### `recordAuthFailure(username, ip, reason): void`
Records failed authentication attempt with reason.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | string | Required | Backend API endpoint for data collection |
| `apiKey` | string | undefined | Optional API key for authentication |
| `collectInterval` | number | 30000 | Data collection interval in milliseconds |
| `debug` | boolean | false | Enable debug logging |
| `enabledFeatures` | object | all enabled | Feature toggles for different monitoring types |
| `security` | object | see below | Security monitoring configuration |
| `performance` | object | see below | Performance monitoring thresholds |
| `serverInfo` | object | required | Server identification information |

### Security Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableBruteForceDetection` | boolean | true | Detect brute force attacks |
| `enableSQLInjectionDetection` | boolean | true | Detect SQL injection attempts |
| `enableXSSDetection` | boolean | true | Detect XSS payloads |
| `suspiciousIPTracking` | boolean | true | Track suspicious IP addresses |
| `maxFailedAttempts` | number | 5 | Max failed login attempts before blocking |
| `bruteForceTimeWindow` | number | 15 | Time window for brute force detection (minutes) |

## 🔒 Security Event Types

- **brute_force_attempt**: Multiple failed authentication attempts
- **sql_injection_attempt**: SQL injection patterns detected
- **xss_attempt**: Cross-site scripting payloads detected
- **csrf_attack**: Cross-site request forgery detected
- **suspicious_file_upload**: Potentially malicious file uploads
- **unusual_api_access**: Abnormal API usage patterns
- **privilege_escalation**: Unauthorized access attempts
- **data_exfiltration**: Unusual data access patterns
- **malicious_ip**: Requests from known malicious IPs
- **rate_limit_exceeded**: Rate limiting violations
- **suspicious_user_agent**: Bot or scraper detection

## 🧪 Testing

### Running the Demo Server

1. Install dependencies:
```bash
cd agents/backend-agent
npm install
```

2. Start the demo server:
```bash
npm run demo
```

3. Test endpoints at `http://localhost:3000`

### Manual Testing Scenarios

**Authentication Testing:**
```bash
# Successful login
curl -X POST http://localhost:3000/api/login \\n  -H \"Content-Type: application/json\" \\n  -d '{\"username\":\"admin\",\"password\":\"password123\"}'

# Failed login (triggers security event)
curl -X POST http://localhost:3000/api/login \\n  -H \"Content-Type: application/json\" \\n  -d '{\"username\":\"admin\",\"password\":\"wrong\"}'
```

**SQL Injection Testing:**
```bash
# Triggers SQL injection detection
curl \"http://localhost:3000/api/search?query=test' OR 1=1--\"
```

**XSS Testing:**
```bash
# Triggers XSS detection
curl -X POST http://localhost:3000/api/comments \\n  -H \"Content-Type: application/json\" \\n  -d '{\"author\":\"test\",\"comment\":\"<script>alert('xss')</script>\"}'
```

**Rate Limiting Testing:**
```bash
# Rapid requests to trigger rate limiting
for i in {1..150}; do curl http://localhost:3000/api/test-rate-limit; done
```

**Performance Testing:**
```bash
# Slow response test
curl http://localhost:3000/api/slow

# Error generation test
curl http://localhost:3000/api/error
```

**Metrics Retrieval:**
```bash
# Get current metrics
curl http://localhost:3000/api/metrics

# Health check
curl http://localhost:3000/health
```

## 📋 Success Criteria

### ✅ **Agent is Working When:**

1. **Console Output Shows:**
   ```
   🛡️ SentinelWeb Backend Agent initialized
   🚀 Starting SentinelWeb Backend Agent
   📊 Backend metrics sent successfully
   ```

2. **Collector API Receives Data:**
   - Regular POST requests to `/api/collect/backend`
   - JSON payloads with server metrics
   - Security events when triggered

3. **Security Detection Works:**
   - SQL injection attempts logged
   - XSS payloads detected
   - Failed authentication tracked
   - Rate limiting enforced

4. **Performance Monitoring Active:**
   - Response times measured
   - Memory usage tracked
   - Slow queries identified
   - Error rates calculated

### 🧪 **Testing Verification:**

- **Authentication**: Failed logins create security events
- **SQL Injection**: Malicious queries trigger alerts
- **XSS Detection**: Script tags in input detected
- **Rate Limiting**: Rapid requests blocked
- **Performance**: Slow endpoints flagged
- **Error Tracking**: 4xx/5xx responses logged

## 🤝 Integration Examples

### Express.js
```javascript
import { SentinelWebBackend } from '@sentinelweb/backend-agent';

const agent = new SentinelWebBackend(config);
app.use(agent.middleware());
agent.start();
```

### Fastify
```javascript
import { SentinelWebBackend } from '@sentinelweb/backend-agent';

const agent = new SentinelWebBackend(config);
fastify.addHook('onRequest', agent.middleware());
agent.start();
```

### Koa.js
```javascript
import { SentinelWebBackend } from '@sentinelweb/backend-agent';

const agent = new SentinelWebBackend(config);
app.use(agent.middleware());
agent.start();
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, bug reports, or feature requests, please visit our [GitHub repository](https://github.com/your-org/sentinelweb).

---

**Made with ❤️ by the SentinelWeb Team**"