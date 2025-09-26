import { SecurityEvent, SecurityEventType } from './types.js';
import { DataCollectionUtils } from './utils.js';

export class SecurityMonitor {
  private securityEvents: SecurityEvent[] = [];
  private suspiciousPatterns: Map<string, number> = new Map();
  private excludeSelectors: string[];

  // Security patterns to detect
  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=\s*[\"'][^\"']*[\"']/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];

  private readonly sqlInjectionPatterns = [
    /('|(\\')|(;)|(\\;))|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute)/gi,
    /(\\x27)|(\\x22)|(\\u0027)|(\\u0022)/gi,
    /(\%27)|(\%22)|(\%3b)|(\%3d)/gi
  ];

  private readonly suspiciousInputPatterns = [
    /\.\.\//g, // Directory traversal
    /eval\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi
  ];

  constructor(excludeSelectors: string[] = []) {
    this.excludeSelectors = excludeSelectors;
    this.setupSecurityMonitoring();
  }

  private setupSecurityMonitoring(): void {
    // Monitor form inputs for suspicious content
    document.addEventListener('input', this.monitorInput.bind(this), { passive: true });
    
    // Monitor form submissions
    document.addEventListener('submit', this.monitorFormSubmission.bind(this), { passive: true });
    
    // Monitor for CSP violations
    document.addEventListener('securitypolicyviolation', this.handleCSPViolation.bind(this));
    
    // Monitor failed login attempts (look for common patterns)
    this.monitorFailedAuthentication();
    
    // Check for CSRF protection
    this.checkCSRFProtection();
    
    // Monitor unusual navigation patterns
    this.monitorNavigationPatterns();
  }

  private monitorInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    
    if (!target || DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
      return;
    }

    const value = target.value;
    if (!value) return;

    // Check for XSS attempts
    if (this.detectXSS(value)) {
      this.addSecurityEvent({
        type: SecurityEventType.XSS_ATTEMPT,
        severity: 'high',
        description: 'Potential XSS payload detected in input field',
        timestamp: Date.now(),
        metadata: {
          elementSelector: DataCollectionUtils.getElementSelector(target),
          inputType: target.type,
          inputName: target.name
        }
      });
    }

    // Check for SQL injection attempts
    if (this.detectSQLInjection(value)) {
      this.addSecurityEvent({
        type: SecurityEventType.SQL_INJECTION_ATTEMPT,
        severity: 'high',
        description: 'Potential SQL injection attempt detected',
        timestamp: Date.now(),
        metadata: {
          elementSelector: DataCollectionUtils.getElementSelector(target),
          inputType: target.type,
          inputName: target.name
        }
      });
    }

    // Check for other suspicious patterns
    if (this.detectSuspiciousInput(value)) {
      this.addSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_INPUT,
        severity: 'medium',
        description: 'Suspicious input pattern detected',
        timestamp: Date.now(),
        metadata: {
          elementSelector: DataCollectionUtils.getElementSelector(target),
          inputType: target.type,
          inputName: target.name
        }
      });
    }
  }

  private monitorFormSubmission(event: Event): void {
    const form = event.target as HTMLFormElement;
    
    if (!form || DataCollectionUtils.shouldExcludeElement(form, this.excludeSelectors)) {
      return;
    }

    // Check for CSRF token presence in forms
    const hasCSRFToken = this.hasCSRFToken(form);
    if (!hasCSRFToken && this.isStateChangingForm(form)) {
      this.addSecurityEvent({
        type: SecurityEventType.CSRF_MISSING,
        severity: 'medium',
        description: 'Form submission without CSRF protection',
        timestamp: Date.now(),
        metadata: {
          formAction: form.action,
          formMethod: form.method,
          formSelector: DataCollectionUtils.getElementSelector(form)
        }
      });
    }
  }

  private handleCSPViolation(event: SecurityPolicyViolationEvent): void {
    this.addSecurityEvent({
      type: SecurityEventType.CONTENT_SECURITY_POLICY_VIOLATION,
      severity: 'high',
      description: 'Content Security Policy violation',
      timestamp: Date.now(),
      metadata: {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy
      }
    });
  }

  private monitorFailedAuthentication(): void {
    // Look for common error messages or failed login indicators
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const text = element.textContent?.toLowerCase() || '';
              
              if (this.isFailedAuthMessage(text)) {
                this.trackFailedAuthentication();
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private monitorNavigationPatterns(): void {
    let navigationCount = 0;
    let rapidNavigationStart = 0;
    
    const handleNavigation = () => {
      const now = Date.now();
      navigationCount++;
      
      if (navigationCount === 1) {
        rapidNavigationStart = now;
      }
      
      // Check for unusually rapid navigation (more than 10 navigations in 30 seconds)
      if (navigationCount > 10 && (now - rapidNavigationStart) < 30000) {
        this.addSecurityEvent({
          type: SecurityEventType.UNUSUAL_NAVIGATION,
          severity: 'medium',
          description: 'Unusual rapid navigation pattern detected',
          timestamp: now,
          metadata: {
            navigationCount,
            timespan: now - rapidNavigationStart
          }
        });
        
        navigationCount = 0; // Reset counter
      }
      
      // Reset counter after 30 seconds
      setTimeout(() => {
        if (navigationCount > 0) navigationCount--;
      }, 30000);
    };

    window.addEventListener('popstate', handleNavigation);
    
    // Also monitor programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      handleNavigation();
      return originalPushState.apply(this, args);
    };
    
    history.replaceState = function(...args) {
      handleNavigation();
      return originalReplaceState.apply(this, args);
    };
  }

  private detectXSS(input: string): boolean {
    return this.xssPatterns.some(pattern => pattern.test(input));
  }

  private detectSQLInjection(input: string): boolean {
    return this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  private detectSuspiciousInput(input: string): boolean {
    return this.suspiciousInputPatterns.some(pattern => pattern.test(input));
  }

  private hasCSRFToken(form: HTMLFormElement): boolean {
    const csrfSelectors = [
      'input[name*="csrf"]',
      'input[name*="token"]',
      'input[name="_token"]',
      'input[name="authenticity_token"]'
    ];
    
    return csrfSelectors.some(selector => form.querySelector(selector) !== null);
  }

  private isStateChangingForm(form: HTMLFormElement): boolean {
    const method = form.method.toLowerCase();
    return method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
  }

  private isFailedAuthMessage(text: string): boolean {
    const failedAuthPatterns = [
      'invalid credentials',
      'login failed',
      'authentication failed',
      'incorrect password',
      'user not found',
      'access denied'
    ];
    
    return failedAuthPatterns.some(pattern => text.includes(pattern));
  }

  private trackFailedAuthentication(): void {
    const key = 'failed_auth';
    const count = this.suspiciousPatterns.get(key) || 0;
    this.suspiciousPatterns.set(key, count + 1);
    
    if (count >= 3) { // Multiple failed attempts
      this.addSecurityEvent({
        type: SecurityEventType.MULTIPLE_FAILED_ATTEMPTS,
        severity: 'high',
        description: 'Multiple failed authentication attempts detected',
        timestamp: Date.now(),
        metadata: {
          attemptCount: count + 1,
          url: window.location.href
        }
      });
    }
  }

  private checkCSRFProtection(): void {
    // Check if the page has CSRF meta tags or tokens
    const hasCSRFMeta = document.querySelector('meta[name="csrf-token"]') !== null;
    const hasCSRFInput = document.querySelector('input[name*="csrf"]') !== null;
    
    if (!hasCSRFMeta && !hasCSRFInput) {
      this.addSecurityEvent({
        type: SecurityEventType.CSRF_MISSING,
        severity: 'low',
        description: 'Page lacks CSRF protection mechanisms',
        timestamp: Date.now(),
        metadata: {
          url: window.location.href,
          hasCSRFMeta,
          hasCSRFInput
        }
      });
    }
  }

  private addSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 100 events to manage memory
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }
  }

  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents]; // Return a copy
  }

  public reset(): void {
    this.securityEvents = [];
    this.suspiciousPatterns.clear();
  }

  public destroy(): void {
    // Clean up observers and event listeners if needed
  }
}