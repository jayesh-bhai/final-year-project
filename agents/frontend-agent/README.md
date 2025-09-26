# 🛡️ SentinelWeb Frontend Agent

The SentinelWeb Frontend Agent is a comprehensive JavaScript/TypeScript library for real-time web application security monitoring and user behavior analytics. It provides intelligent tracking of user interactions, security events, performance metrics, and error monitoring with built-in privacy controls.

## ✨ Features

### 🔍 **Comprehensive Monitoring**
- **User Behavior Tracking**: Mouse clicks, keystrokes, scrolling, form interactions
- **Security Event Detection**: XSS attempts, SQL injection, CSRF protection monitoring
- **Performance Monitoring**: Page load times, Core Web Vitals, resource performance
- **Error Tracking**: JavaScript errors, network failures, resource loading issues
- **Network Monitoring**: API calls, response times, HTTP status tracking

### 🔒 **Privacy-First Design**
- **GDPR/CCPA Compliant**: Respects Do Not Track settings
- **Data Sanitization**: Automatically masks sensitive information
- **Configurable Exclusions**: Exclude specific elements from tracking
- **User Consent**: Built-in privacy controls and consent management

### ⚡ **High Performance**
- **Lightweight**: Minimal impact on page performance (<5% overhead)
- **Throttled Collection**: Intelligent event batching and throttling
- **Memory Management**: Automatic cleanup of old data
- **Non-blocking**: Asynchronous data collection and transmission

## 🚀 Quick Start

### Installation

```bash
npm install @sentinelweb/frontend-agent
```

### Basic Usage

```javascript
import { SentinelWebFrontend } from '@sentinelweb/frontend-agent';

// Initialize with default configuration
const agent = new SentinelWebFrontend({
  apiEndpoint: 'https://your-api.com/collect/frontend',
  collectInterval: 5000, // 5 seconds
  debug: true
});

// Start monitoring
agent.start();
```

### Advanced Configuration

```javascript
const agent = new SentinelWebFrontend({
  apiEndpoint: 'https://your-api.com/collect/frontend',
  apiKey: 'your-api-key',
  collectInterval: 10000,
  enabledFeatures: {
    domEvents: true,
    performanceMonitoring: true,
    userBehavior: true,
    securityEvents: true,
    errorTracking: true,
    networkMonitoring: true
  },
  privacy: {
    maskSensitiveData: true,
    excludeSelectors: [
      'input[type="password"]',
      'input[name*="credit"]',
      '.sensitive-data'
    ],
    anonymizeIPs: true,
    respectDoNotTrack: true
  },
  debug: false
});

agent.start();
```

### HTML Script Tag Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script>
    // Configuration (optional)
    window.SentinelWebConfig = {
      apiEndpoint: 'https://your-api.com/collect/frontend',
      debug: true
    };
    
    // Auto-start when loaded
    window.SentinelWebAutoStart = true;
  </script>
  <script src="https://unpkg.com/@sentinelweb/frontend-agent/dist/index.umd.js"></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

## 📊 Data Collection

### User Behavior Metrics
```javascript
{
  mouseClicks: 45,
  keystrokes: 120,
  scrollEvents: 8,
  formInteractions: 3,
  navigationEvents: 2,
  idleTime: 30000,
  mouseMovements: [...],
  clickPattern: [...]
}
```

### Security Events
```javascript
{
  type: 'xss_attempt',
  severity: 'high',
  description: 'Potential XSS payload detected in input field',
  timestamp: 1645123456789,
  metadata: {
    elementSelector: '#user-input',
    inputType: 'text',
    inputName: 'comment'
  }
}
```

### Performance Metrics
```javascript
{
  loadTime: 1250,
  domContentLoaded: 890,
  firstPaint: 654,
  firstContentfulPaint: 723,
  largestContentfulPaint: 1100,
  cumulativeLayoutShift: 0.05,
  firstInputDelay: 12
}
```

## 🛠️ API Reference

### Core Methods

#### `start(): void`
Starts the SentinelWeb agent and begins data collection.

#### `stop(): void`
Stops the agent and cleans up all event listeners.

#### `collectData(): FrontendMetrics | null`
Manually triggers data collection and returns current metrics.

#### `reset(): void`
Resets all collected data and generates a new session ID.

#### `updateConfig(updates: Partial<SentinelConfig>): void`
Updates the agent configuration. Restarts the agent if currently running.

#### `getSessionId(): string`
Returns the current session ID.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | string | Required | Backend API endpoint for data collection |
| `apiKey` | string | undefined | Optional API key for authentication |
| `collectInterval` | number | 5000 | Data collection interval in milliseconds |
| `debug` | boolean | false | Enable debug logging |
| `enabledFeatures` | object | all enabled | Feature toggles for different monitoring types |
| `privacy` | object | see below | Privacy and data protection settings |

### Privacy Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maskSensitiveData` | boolean | true | Automatically mask sensitive information |
| `excludeSelectors` | string[] | password fields | CSS selectors to exclude from tracking |
| `anonymizeIPs` | boolean | true | Anonymize IP addresses |
| `respectDoNotTrack` | boolean | true | Respect browser Do Not Track setting |

## 🔒 Security Features

### Threat Detection
- **XSS Prevention**: Detects potential cross-site scripting attempts
- **SQL Injection**: Identifies SQL injection patterns in user input
- **CSRF Protection**: Monitors for missing CSRF tokens
- **Content Security Policy**: Tracks CSP violations
- **Suspicious Navigation**: Detects unusual navigation patterns

### Data Protection
- **Sensitive Data Masking**: Automatically redacts passwords, credit cards, SSNs
- **GDPR Compliance**: Built-in privacy controls and user consent
- **Secure Transmission**: HTTPS-only data transmission
- **Data Retention**: Configurable data retention policies

## 📈 Performance Impact

The SentinelWeb Frontend Agent is designed for minimal performance impact:

- **Bundle Size**: ~15KB gzipped
- **Memory Usage**: <2MB typical
- **CPU Impact**: <5% under normal load
- **Network**: Batched requests, configurable intervals

## 🧪 Testing

### Running the Test Page

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run serve
```

3. Open `http://localhost:8080` in your browser

4. Use the test interface to trigger various monitoring scenarios

### Building for Production

```bash
npm run build
```

This creates optimized bundles in the `dist/` directory:
- `index.js` - ES Module bundle
- `index.umd.js` - UMD bundle for browser script tags

## 🤝 Integration Examples

### React Integration

```jsx
import { useEffect } from 'react';
import { SentinelWebFrontend } from '@sentinelweb/frontend-agent';

function App() {
  useEffect(() => {
    const agent = new SentinelWebFrontend({
      apiEndpoint: process.env.REACT_APP_SENTINEL_ENDPOINT,
      debug: process.env.NODE_ENV === 'development'
    });
    
    agent.start();
    
    return () => agent.stop();
  }, []);
  
  return <div>Your app content</div>;
}
```

### Vue.js Integration

```javascript
// main.js
import { SentinelWebFrontend } from '@sentinelweb/frontend-agent';

const app = createApp(App);

const agent = new SentinelWebFrontend({
  apiEndpoint: import.meta.env.VITE_SENTINEL_ENDPOINT
});

app.config.globalProperties.$sentinel = agent;
agent.start();

app.mount('#app');
```

### Angular Integration

```typescript
// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SentinelWebFrontend } from '@sentinelweb/frontend-agent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private agent?: SentinelWebFrontend;
  
  ngOnInit() {
    this.agent = new SentinelWebFrontend({
      apiEndpoint: environment.sentinelEndpoint
    });
    this.agent.start();
  }
  
  ngOnDestroy() {
    this.agent?.stop();
  }
}
```

## 📋 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, bug reports, or feature requests, please visit our [GitHub repository](https://github.com/your-org/sentinelweb).

---

**Made with ❤️ by the SentinelWeb Team**