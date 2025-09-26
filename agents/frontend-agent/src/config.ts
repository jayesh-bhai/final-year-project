import { SentinelConfig, EnabledFeatures, PrivacyConfig } from './types.js';

export const DEFAULT_CONFIG: SentinelConfig = {
  apiEndpoint: 'http://localhost:5000/api/collect/frontend',
  collectInterval: 5000, // 5 seconds
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
      'input[name*="password"]',
      'input[name*="credit"]',
      'input[name*="ssn"]',
      '.sensitive-data'
    ],
    anonymizeIPs: true,
    respectDoNotTrack: true
  },
  debug: false
};

export class ConfigManager {
  private config: SentinelConfig;

  constructor(userConfig: Partial<SentinelConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, userConfig);
  }

  private mergeConfig(defaultConfig: SentinelConfig, userConfig: Partial<SentinelConfig>): SentinelConfig {
    return {
      ...defaultConfig,
      ...userConfig,
      enabledFeatures: {
        ...defaultConfig.enabledFeatures,
        ...userConfig.enabledFeatures
      },
      privacy: {
        ...defaultConfig.privacy,
        ...userConfig.privacy
      }
    };
  }

  public getConfig(): SentinelConfig {
    return this.config;
  }

  public updateConfig(updates: Partial<SentinelConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  public isFeatureEnabled(feature: keyof EnabledFeatures): boolean {
    return this.config.enabledFeatures[feature];
  }

  public shouldRespectPrivacy(): boolean {
    if (this.config.privacy.respectDoNotTrack && 
        navigator.doNotTrack === '1') {
      return true;
    }
    return false;
  }
}