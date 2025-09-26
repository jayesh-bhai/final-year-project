// Type definitions for SentinelWeb Frontend Agent

export interface SentinelConfig {
  apiEndpoint: string;
  apiKey?: string;
  collectInterval: number;
  enabledFeatures: EnabledFeatures;
  privacy: PrivacyConfig;
  debug: boolean;
}

export interface EnabledFeatures {
  domEvents: boolean;
  performanceMonitoring: boolean;
  userBehavior: boolean;
  securityEvents: boolean;
  errorTracking: boolean;
  networkMonitoring: boolean;
}

export interface PrivacyConfig {
  maskSensitiveData: boolean;
  excludeSelectors: string[];
  anonymizeIPs: boolean;
  respectDoNotTrack: boolean;
}

export interface FrontendMetrics {
  sessionId: string;
  timestamp: number;
  url: string;
  userAgent: string;
  sessionDuration: number;
  pageMetrics: PageMetrics;
  userBehavior: UserBehaviorMetrics;
  securityEvents: SecurityEvent[];
  performanceMetrics: PerformanceMetrics;
  errorEvents: ErrorEvent[];
  networkEvents: NetworkEvent[];
}

export interface PageMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

export interface UserBehaviorMetrics {
  mouseClicks: number;
  keystrokes: number;
  scrollEvents: number;
  formInteractions: number;
  navigationEvents: number;
  idleTime: number;
  mouseMovements: MouseMovement[];
  clickPattern: ClickEvent[];
}

export interface MouseMovement {
  x: number;
  y: number;
  timestamp: number;
}

export interface ClickEvent {
  element: string;
  x: number;
  y: number;
  timestamp: number;
  button: number;
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export enum SecurityEventType {
  SUSPICIOUS_INPUT = 'suspicious_input',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  CSRF_MISSING = 'csrf_missing',
  UNUSUAL_NAVIGATION = 'unusual_navigation',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  SUSPICIOUS_HEADERS = 'suspicious_headers',
  CONTENT_SECURITY_POLICY_VIOLATION = 'csp_violation'
}

export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUtilization: number;
  networkLatency: number;
  renderTime: number;
  jsExecutionTime: number;
}

export interface ErrorEvent {
  type: 'javascript' | 'network' | 'resource';
  message: string;
  source: string;
  line: number;
  column: number;
  stack: string;
  timestamp: number;
}

export interface NetworkEvent {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: number;
}