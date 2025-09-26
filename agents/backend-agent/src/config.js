export const DEFAULT_BACKEND_CONFIG = {
  apiEndpoint: 'http://localhost:5000/api/collect/backend',
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
    enableCSRFProtection: true,
    suspiciousIPTracking: true,
    maxFailedAttempts: 5,
    bruteForceTimeWindow: 15 // 15 minutes
  },
  performance: {
    slowQueryThreshold: 1000, // 1 second
    slowResponseThreshold: 2000, // 2 seconds
    highMemoryThreshold: 80, // 80%
    highCPUThreshold: 80 // 80%
  },
  debug: false,
  serverInfo: {
    serverId: 'default-server',
    serverName: 'Unknown Server',
    environment: 'development',
    version: '1.0.0'
  }
};

export class BackendConfigManager {
  constructor(userConfig = {}) {
    this.config = this.mergeConfig(DEFAULT_BACKEND_CONFIG, userConfig);
  }

  mergeConfig(defaultConfig, userConfig) {
    return {
      ...defaultConfig,
      ...userConfig,
      enabledFeatures: {
        ...defaultConfig.enabledFeatures,
        ...userConfig.enabledFeatures
      },
      security: {
        ...defaultConfig.security,
        ...userConfig.security
      },
      performance: {
        ...defaultConfig.performance,
        ...userConfig.performance
      },
      serverInfo: {
        ...defaultConfig.serverInfo,
        ...userConfig.serverInfo
      }
    };
  }

  getConfig() {
    return this.config;
  }

  updateConfig(updates) {
    this.config = this.mergeConfig(this.config, updates);
  }

  isFeatureEnabled(feature) {
    return this.config.enabledFeatures[feature];
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getPerformanceConfig() {
    return this.config.performance;
  }

  getServerInfo() {
    return this.config.serverInfo;
  }
}