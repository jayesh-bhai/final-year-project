import { PerformanceMetrics, PageMetrics } from './types.js';

export class PerformanceMonitor {
  private memoryUsage: number = 0;
  private cpuUtilization: number = 0;
  private networkLatency: number = 0;
  private renderTime: number = 0;
  private jsExecutionTime: number = 0;

  constructor() {
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance metrics periodically
    this.startPerformanceCollection();
    
    // Monitor long tasks (tasks that block main thread for > 50ms)
    this.monitorLongTasks();
    
    // Monitor resource loading
    this.monitorResourceLoading();
  }

  private startPerformanceCollection(): void {
    setInterval(() => {
      this.collectMemoryUsage();
      this.collectNetworkLatency();
      this.collectRenderMetrics();
    }, 5000); // Collect every 5 seconds
  }

  private collectMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  private collectNetworkLatency(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkLatency = connection.rtt || 0;
    }
  }

  private collectRenderMetrics(): void {
    if ('now' in performance) {
      const start = performance.now();
      requestAnimationFrame(() => {
        this.renderTime = performance.now() - start;
      });
    }
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Long task threshold
              this.jsExecutionTime += entry.duration;
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver might not support longtask
        console.warn('Long task monitoring not supported:', e);
      }
    }
  }

  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              // Track slow resources
              if (entry.duration > 1000) { // Resources taking > 1 second
                console.warn('Slow resource detected:', entry.name, entry.duration);
              }
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource monitoring not supported:', e);
      }
    }
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return {
      memoryUsage: this.memoryUsage,
      cpuUtilization: this.cpuUtilization,
      networkLatency: this.networkLatency,
      renderTime: this.renderTime,
      jsExecutionTime: this.jsExecutionTime
    };
  }

  public getPageMetrics(): PageMetrics {
    const timing = performance.timing;
    const paintEntries = performance.getEntriesByType('paint');
    
    let firstPaint = 0;
    let firstContentfulPaint = 0;
    let largestContentfulPaint = 0;
    let cumulativeLayoutShift = 0;
    let firstInputDelay = 0;

    // Get paint metrics
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });

    // Get LCP if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            largestContentfulPaint = lastEntry.startTime;
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }
    }

    // Get CLS if available
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          cumulativeLayoutShift = clsValue;
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }

    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint,
      cumulativeLayoutShift,
      firstInputDelay
    };
  }

  public reset(): void {
    this.memoryUsage = 0;
    this.cpuUtilization = 0;
    this.networkLatency = 0;
    this.renderTime = 0;
    this.jsExecutionTime = 0;
  }

  public destroy(): void {
    // Clean up performance observers if needed
  }
}