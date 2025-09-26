export class DataCollectionUtils {
  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current timestamp in milliseconds
   */
  static getTimestamp(): number {
    return Date.now();
  }

  /**
   * Safely get element selector path
   */
  static getElementSelector(element: Element): string {
    if (!element) return '';
    
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  /**
   * Sanitize sensitive data based on privacy settings
   */
  static sanitizeData(data: any, excludeSelectors: string[]): any {
    if (typeof data === 'string') {
      // Check for common sensitive patterns
      if (this.containsSensitiveData(data)) {
        return '[REDACTED]';
      }
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value, excludeSelectors);
        }
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Check if data contains sensitive information
   */
  private static containsSensitiveData(data: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (in some contexts)
      /password|pwd|secret|token/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(data));
  }

  /**
   * Check if a key is considered sensitive
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'pwd', 'secret', 'token', 'key', 'auth',
      'credit', 'card', 'ssn', 'social', 'security'
    ];
    
    const keyLower = key.toLowerCase();
    return sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Debounce function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number;
    return function(this: any, ...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait) as any;
    };
  }

  /**
   * Check if an element should be excluded from tracking
   */
  static shouldExcludeElement(element: Element, excludeSelectors: string[]): boolean {
    return excludeSelectors.some(selector => {
      try {
        return element.matches(selector);
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Get viewport information
   */
  static getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }

  /**
   * Get browser information
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      doNotTrack: navigator.doNotTrack
    };
  }

  /**
   * Check if the current page is loaded over HTTPS
   */
  static isSecureContext(): boolean {
    return window.isSecureContext || location.protocol === 'https:';
  }

  /**
   * Get performance timing information
   */
  static getPerformanceTiming() {
    if (!('performance' in window)) {
      return null;
    }

    const timing = performance.timing;
    const navigation = performance.navigation;

    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      navigationTiming: {
        redirectTime: timing.redirectEnd - timing.redirectStart,
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        connectTime: timing.connectEnd - timing.connectStart,
        requestTime: timing.responseEnd - timing.requestStart,
        responseTime: timing.responseEnd - timing.responseStart,
        domProcessingTime: timing.loadEventStart - timing.domLoading,
        loadEventTime: timing.loadEventEnd - timing.loadEventStart
      },
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount
    };
  }

  /**
   * Get First Paint timing
   */
  private static getFirstPaint(): number {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const paintEntries = performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : 0;
    }
    return 0;
  }
}