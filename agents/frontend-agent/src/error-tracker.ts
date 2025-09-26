import { ErrorEvent, NetworkEvent } from './types.js';

export class ErrorTracker {
  private errorEvents: ErrorEvent[] = [];
  private networkEvents: NetworkEvent[] = [];
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.setupErrorTracking();
  }

  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', this.handleJavaScriptError.bind(this));
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Resource loading errors
    window.addEventListener('error', this.handleResourceError.bind(this), true);
    
    // Network monitoring
    this.interceptFetch();
    this.interceptXHR();
  }

  private handleJavaScriptError(event: any): void {
    const errorEvent: ErrorEvent = {
      type: 'javascript',
      message: event.message,
      source: event.filename || '',
      line: event.lineno || 0,
      column: event.colno || 0,
      stack: event.error?.stack || '',
      timestamp: Date.now()
    };

    this.addErrorEvent(errorEvent);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const errorEvent: ErrorEvent = {
      type: 'javascript',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      source: window.location.href,
      line: 0,
      column: 0,
      stack: event.reason?.stack || '',
      timestamp: Date.now()
    };

    this.addErrorEvent(errorEvent);
  }

  private handleResourceError(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (target && target !== (window as any) && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const errorEvent: ErrorEvent = {
        type: 'resource',
        message: `Failed to load resource: ${target.tagName}`,
        source: (target as any).src || (target as any).href || '',
        line: 0,
        column: 0,
        stack: '',
        timestamp: Date.now()
      };

      this.addErrorEvent(errorEvent);
    }
  }

  private interceptFetch(): void {
    const self = this;
    
    window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || args[0].toString();
      const method = args[1]?.method || 'GET';
      
      let requestSize = 0;
      if (args[1]?.body) {
        requestSize = new TextEncoder().encode(String(args[1].body)).length;
      }

      try {
        const response = await self.originalFetch.apply(this, args);
        const endTime = Date.now();
        
        // Get response size estimate
        const responseSize = parseInt(response.headers.get('content-length') || '0');
        
        const networkEvent: NetworkEvent = {
          url,
          method,
          status: response.status,
          responseTime: endTime - startTime,
          requestSize,
          responseSize,
          timestamp: startTime
        };

        self.addNetworkEvent(networkEvent);

        // Track network errors
        if (!response.ok) {
          const errorEvent: ErrorEvent = {
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            source: url,
            line: 0,
            column: 0,
            stack: '',
            timestamp: Date.now()
          };
          self.addErrorEvent(errorEvent);
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        
        // Track failed network request
        const networkEvent: NetworkEvent = {
          url,
          method,
          status: 0,
          responseTime: endTime - startTime,
          requestSize,
          responseSize: 0,
          timestamp: startTime
        };

        self.addNetworkEvent(networkEvent);

        // Track network error
        const errorEvent: ErrorEvent = {
          type: 'network',
          message: `Network error: ${error}`,
          source: url,
          line: 0,
          column: 0,
          stack: error instanceof Error ? error.stack || '' : '',
          timestamp: Date.now()
        };
        self.addErrorEvent(errorEvent);

        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const self = this;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      const startTime = Date.now();
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Store request info on the XHR object
      (this as any)._sentinelStartTime = startTime;
      (this as any)._sentinelMethod = method;
      (this as any)._sentinelUrl = urlString;
      
      // Set up event listeners
      this.addEventListener('loadend', function() {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        const networkEvent: NetworkEvent = {
          url: urlString,
          method: method.toUpperCase(),
          status: this.status,
          responseTime,
          requestSize: 0, // Hard to calculate for XHR
          responseSize: this.responseText ? this.responseText.length : 0,
          timestamp: startTime
        };

        self.addNetworkEvent(networkEvent);

        // Track HTTP errors
        if (this.status >= 400) {
          const errorEvent: ErrorEvent = {
            type: 'network',
            message: `HTTP ${this.status}: ${this.statusText}`,
            source: urlString,
            line: 0,
            column: 0,
            stack: '',
            timestamp: Date.now()
          };
          self.addErrorEvent(errorEvent);
        }
      });

      this.addEventListener('error', function() {
        const errorEvent: ErrorEvent = {
          type: 'network',
          message: 'XMLHttpRequest error',
          source: urlString,
          line: 0,
          column: 0,
          stack: '',
          timestamp: Date.now()
        };
        self.addErrorEvent(errorEvent);
      });

      return self.originalXHROpen.apply(this, [method, url, true]);
    };
  }

  private addErrorEvent(errorEvent: ErrorEvent): void {
    this.errorEvents.push(errorEvent);
    
    // Keep only last 50 errors to manage memory
    if (this.errorEvents.length > 50) {
      this.errorEvents.shift();
    }
  }

  private addNetworkEvent(networkEvent: NetworkEvent): void {
    this.networkEvents.push(networkEvent);
    
    // Keep only last 100 network events to manage memory
    if (this.networkEvents.length > 100) {
      this.networkEvents.shift();
    }
  }

  public getErrorEvents(): ErrorEvent[] {
    return [...this.errorEvents]; // Return a copy
  }

  public getNetworkEvents(): NetworkEvent[] {
    return [...this.networkEvents]; // Return a copy
  }

  public reset(): void {
    this.errorEvents = [];
    this.networkEvents = [];
  }

  public destroy(): void {
    // Restore original functions
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
  }
}