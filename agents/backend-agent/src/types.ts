// Type definitions for SentinelWeb Backend Agent

export interface BackendConfig {
  apiEndpoint: string;
  apiKey?: string;
  collectInterval: number;
  enabledFeatures: BackendEnabledFeatures;
  security: SecurityConfig;
  performance: PerformanceConfig;
  debug: boolean;
  serverInfo: ServerInfo;
}

export interface BackendEnabledFeatures {
  authenticationMonitoring: boolean;
  apiRequestTracking: boolean;
  databaseMonitoring: boolean;
  errorTracking: boolean;
  performanceMonitoring: boolean;
  securityEventDetection: boolean;
  fileUploadMonitoring: boolean;
  rateLimitingMonitoring: boolean;
}

export interface SecurityConfig {
  enableBruteForceDetection: boolean;
  enableSQLInjectionDetection: boolean;
  enableXSSDetection: boolean;
  enableCSRFProtection: boolean;
  suspiciousIPTracking: boolean;
  maxFailedAttempts: number;
  bruteForceTimeWindow: number; // minutes
}

export interface PerformanceConfig {
  slowQueryThreshold: number; // milliseconds
  slowResponseThreshold: number; // milliseconds
  highMemoryThreshold: number; // percentage
  highCPUThreshold: number; // percentage
}

export interface ServerInfo {
  serverId: string;
  serverName: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  region?: string;
}

export interface BackendMetrics {
  sessionId: string;
  serverId: string;
  timestamp: number;
  serverInfo: ServerInfo;
  authenticationMetrics: AuthenticationMetrics;
  apiMetrics: APIMetrics;
  databaseMetrics: DatabaseMetrics;
  securityEvents: BackendSecurityEvent[];
  performanceMetrics: BackendPerformanceMetrics;
  errorEvents: BackendErrorEvent[];
  systemMetrics: SystemMetrics;
}

export interface AuthenticationMetrics {
  totalLoginAttempts: number;
  successfulLogins: number;
  failedLogins: number;
  blockedIPs: string[];
  suspiciousLogins: SuspiciousLogin[];
  passwordResetRequests: number;
  newUserRegistrations: number;
}

export interface SuspiciousLogin {
  ip: string;
  userAgent: string;
  timestamp: number;
  reason: string;
  username?: string;
}

export interface APIMetrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByEndpoint: Record<string, number>;
  responseTimeAvg: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  statusCodes: Record<string, number>;
  unusualEndpoints: string[];
  rateLimitHits: number;
}

export interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: SlowQuery[];
  queryErrors: number;
  connectionPoolUsage: number;
  suspiciousQueries: SuspiciousQuery[];
  databaseConnections: number;
  cacheHitRate: number;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: number;
  endpoint?: string;
}

export interface SuspiciousQuery {
  query: string;
  timestamp: number;
  ip: string;
  suspicionLevel: 'low' | 'medium' | 'high';
  reason: string;
}

export interface BackendSecurityEvent {
  type: BackendSecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  ip: string;
  userAgent?: string;
  endpoint?: string;
  userId?: string;
  metadata: Record<string, any>;
}

export enum BackendSecurityEventType {
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTACK = 'csrf_attack',
  SUSPICIOUS_FILE_UPLOAD = 'suspicious_file_upload',
  UNUSUAL_API_ACCESS = 'unusual_api_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  MALICIOUS_IP = 'malicious_ip',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  AUTHENTICATION_BYPASS = 'authentication_bypass',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent'
}

export interface BackendPerformanceMetrics {
  responseTime: ResponseTimeMetrics;
  systemUsage: SystemUsage;
  databasePerformance: DatabasePerformance;
  memoryUsage: MemoryUsage;
  errorRates: ErrorRates;
}

export interface ResponseTimeMetrics {
  average: number;
  median: number;
  p95: number;
  p99: number;
  slowestEndpoints: EndpointPerformance[];
}

export interface EndpointPerformance {
  endpoint: string;
  averageTime: number;
  requestCount: number;
  errorRate: number;
}

export interface SystemUsage {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
  activeConnections: number;
}

export interface DatabasePerformance {
  averageQueryTime: number;
  slowQueryCount: number;
  connectionPoolUsage: number;
  cacheHitRate: number;
  deadlockCount: number;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface ErrorRates {
  http4xx: number;
  http5xx: number;
  databaseErrors: number;
  applicationErrors: number;
  timeoutErrors: number;
}

export interface BackendErrorEvent {
  type: 'http' | 'database' | 'application' | 'system';
  message: string;
  stack: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  timestamp: number;
  ip?: string;
  userId?: string;
}

export interface SystemMetrics {
  uptime: number;
  serverLoad: number[];
  memoryInfo: MemoryUsage;
  diskSpace: DiskSpaceInfo;
  networkStats: NetworkStats;
}

export interface DiskSpaceInfo {
  total: number;
  free: number;
  used: number;
  percentage: number;
}

export interface NetworkStats {
  bytesReceived: number;
  bytesSent: number;
  packetsReceived: number;
  packetsSent: number;
}

export interface RequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  ip: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export interface ResponseInfo {
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
  timestamp: number;
  size: number;
}