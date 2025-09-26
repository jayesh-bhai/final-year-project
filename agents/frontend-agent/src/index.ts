import { ConfigManager } from './config.js';
import { BehaviorTracker } from './behavior-tracker.js';
import { SecurityMonitor } from './security-monitor.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { ErrorTracker } from './error-tracker.js';
import { DataCollectionUtils } from './utils.js';
import { SentinelConfig, FrontendMetrics } from './types.js';

export class SentinelWebFrontend {
  private config: ConfigManager;
  private sessionId: string;
  private startTime: number;
  private isRunning: boolean = false;
  
  // Component instances
  private behaviorTracker?: BehaviorTracker;
  private securityMonitor?: SecurityMonitor;
  private performanceMonitor?: PerformanceMonitor;
  private errorTracker?: ErrorTracker;
  
  // Collection interval
  private collectionInterval?: number;

  constructor(userConfig: Partial<SentinelConfig> = {}) {
    this.config = new ConfigManager(userConfig);
    this.sessionId = DataCollectionUtils.generateSessionId();
    this.startTime = Date.now();
    
    // Check privacy settings
    if (this.config.shouldRespectPrivacy()) {
      console.log('SentinelWeb: Respecting Do Not Track setting');
      return;
    }

    this.initializeComponents();
  }

  private initializeComponents(): void {
    const configData = this.config.getConfig();
    const excludeSelectors = configData.privacy.excludeSelectors;

    // Initialize components based on enabled features
    if (this.config.isFeatureEnabled('userBehavior')) {
      this.behaviorTracker = new BehaviorTracker(excludeSelectors);
    }

    if (this.config.isFeatureEnabled('securityEvents')) {
      this.securityMonitor = new SecurityMonitor(excludeSelectors);
    }

    if (this.config.isFeatureEnabled('performanceMonitoring')) {
      this.performanceMonitor = new PerformanceMonitor();
    }

    if (this.config.isFeatureEnabled('errorTracking') || this.config.isFeatureEnabled('networkMonitoring')) {
      this.errorTracker = new ErrorTracker();
    }
  }

  /**
   * Start the SentinelWeb frontend agent
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('SentinelWeb: Agent is already running');
      return;
    }

    if (this.config.shouldRespectPrivacy()) {
      console.log('SentinelWeb: Not starting due to privacy settings');
      return;
    }

    this.isRunning = true;
    const configData = this.config.getConfig();
    
    if (configData.debug) {
      console.log('SentinelWeb: Starting frontend agent', {
        sessionId: this.sessionId,
        config: configData
      });
    }

    // Start periodic data collection
    this.startDataCollection();
  }

  /**
   * Stop the SentinelWeb frontend agent
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }

    // Clean up components
    this.behaviorTracker?.destroy();
    this.securityMonitor?.destroy();
    this.performanceMonitor?.destroy();
    this.errorTracker?.destroy();

    const configData = this.config.getConfig();
    if (configData.debug) {
      console.log('SentinelWeb: Stopped frontend agent');
    }
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<SentinelConfig>): void {
    this.config.updateConfig(updates);
    
    // Reinitialize components if needed
    if (this.isRunning) {
      this.stop();
      this.initializeComponents();
      this.start();
    }
  }

  /**
   * Manually trigger data collection
   */
  public collectData(): FrontendMetrics | null {
    if (this.config.shouldRespectPrivacy()) {
      return null;
    }

    return this.gatherMetrics();
  }

  /**
   * Start periodic data collection
   */
  private startDataCollection(): void {
    const configData = this.config.getConfig();
    
    this.collectionInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      try {
        const metrics = this.gatherMetrics();
        this.sendMetrics(metrics);
      } catch (error) {
        console.error('SentinelWeb: Error collecting data:', error);
      }
    }, configData.collectInterval) as any;
  }

  /**
   * Gather all metrics from components
   */
  private gatherMetrics(): FrontendMetrics {
    const configData = this.config.getConfig();
    const now = Date.now();
    
    const metrics: FrontendMetrics = {
      sessionId: this.sessionId,
      timestamp: now,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionDuration: now - this.startTime,
      pageMetrics: this.performanceMonitor?.getPageMetrics() || {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0
      },
      userBehavior: this.behaviorTracker?.getMetrics() || {
        mouseClicks: 0,
        keystrokes: 0,
        scrollEvents: 0,
        formInteractions: 0,
        navigationEvents: 0,
        idleTime: 0,
        mouseMovements: [],
        clickPattern: []
      },
      securityEvents: this.securityMonitor?.getSecurityEvents() || [],
      performanceMetrics: this.performanceMonitor?.getPerformanceMetrics() || {
        memoryUsage: 0,
        cpuUtilization: 0,
        networkLatency: 0,
        renderTime: 0,
        jsExecutionTime: 0
      },
      errorEvents: this.errorTracker?.getErrorEvents() || [],
      networkEvents: this.errorTracker?.getNetworkEvents() || []
    };

    // Sanitize sensitive data if privacy is enabled
    if (configData.privacy.maskSensitiveData) {
      return DataCollectionUtils.sanitizeData(metrics, configData.privacy.excludeSelectors);
    }

    return metrics;
  }

  /**
   * Send metrics to the backend
   */
  private async sendMetrics(metrics: FrontendMetrics): Promise<void> {
    const configData = this.config.getConfig();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (configData.apiKey) {
        headers['Authorization'] = `Bearer ${configData.apiKey}`;
      }

      const response = await fetch(configData.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(metrics)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (configData.debug) {
        console.log('SentinelWeb: Metrics sent successfully', metrics);
      }
    } catch (error) {
      if (configData.debug) {
        console.error('SentinelWeb: Failed to send metrics:', error);
      }
      
      // Could implement retry logic here
      // or store metrics locally for later transmission
    }
  }

  /**
   * Reset all collected data
   */
  public reset(): void {
    this.behaviorTracker?.reset();
    this.securityMonitor?.reset();
    this.performanceMonitor?.reset();
    this.errorTracker?.reset();
    
    this.sessionId = DataCollectionUtils.generateSessionId();
    this.startTime = Date.now();
  }
}

// Export default instance for easy usage
export default SentinelWebFrontend;

// Also export types for TypeScript users
export * from './types.js';
export { ConfigManager } from './config.js';
export { DataCollectionUtils } from './utils.js';

// Auto-start functionality for script tag usage
if (typeof window !== 'undefined' && (window as any).SentinelWebAutoStart) {
  const agent = new SentinelWebFrontend((window as any).SentinelWebConfig || {});
  agent.start();
  
  // Make agent globally available
  (window as any).SentinelWeb = agent;
}