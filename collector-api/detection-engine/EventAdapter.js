/**
 * Event Adapter Module
 * Purpose: Convert incoming collector events into a normalized internal format.
 * Responsibilities:
 * - Accept event object from Collector API
 * - Validate required fields
 * - Normalize structure
 * Input: Raw event JSON
 * Output: NormalizedEvent object
 * Rules: No detection here, No ML here, No database writes here
 */

export class EventAdapter {
  constructor() {
    // No initialization needed
  }

  /**
   * Normalizes raw events from frontend or backend agents into a unified format
   * @param {Object} rawEvent - Raw event from frontend or backend agent
   * @returns {Object} Normalized event object following canonical schema
   */
  normalizeEvent(rawEvent) {
    // Handle both raw agent events and canonical test events
    const normalized = {
      event_type: rawEvent.event_type || rawEvent.type || 'unknown',
      source: rawEvent.source || 'unknown',
      timestamp: rawEvent.timestamp || Date.now(),

      actor: {
        ip: rawEvent.ip || rawEvent.ip_address || rawEvent.actor?.ip || 'unknown',
        user_id: rawEvent.userId || rawEvent.user_id || rawEvent.actor?.user_id || 'unknown',
        session_id: rawEvent.sessionId || rawEvent.session_id || rawEvent.actor?.session_id || 'unknown'
      },

      request: {
        method: rawEvent.request?.method || rawEvent.method || 'unknown',
        path: this.extractPathFromUrl(rawEvent.request?.path || rawEvent.url || rawEvent.request?.url),
        query_params: rawEvent.request?.query_params || rawEvent.query_params || this.extractQueryParams(rawEvent.url || rawEvent.request?.url),
        headers: this.extractHeaders(rawEvent),
        body: rawEvent.request?.body || rawEvent.body || this.extractBody(rawEvent)
      },

      behavior: {
        failed_auth_attempts: this.extractFailedAuthAttempts(rawEvent),
        request_count: this.extractRequestCount(rawEvent),
        rate_violation_count: this.extractRateViolations(rawEvent),
        interaction_rate: this.extractInteractionRate(rawEvent),
        idle_time: this.extractIdleTime(rawEvent)
      },

      payloads: this.extractAllPayloads(rawEvent)
    };

    // Also handle direct behavior field from test events
    if (rawEvent.behavior) {
      normalized.behavior.failed_auth_attempts = rawEvent.behavior.failed_auth_attempts || normalized.behavior.failed_auth_attempts;
      normalized.behavior.request_count = rawEvent.behavior.request_count || normalized.behavior.request_count;
      normalized.behavior.rate_violation_count = rawEvent.behavior.rate_violation_count || normalized.behavior.rate_violation_count;
      normalized.behavior.interaction_rate = rawEvent.behavior.interaction_rate || normalized.behavior.interaction_rate;
      normalized.behavior.idle_time = rawEvent.behavior.idle_time || normalized.behavior.idle_time;
    }

    return normalized;
  }

  /**
   * Extracts path from URL
   * @param {string} url - URL string
   * @returns {string} Path component of URL
   */
  extractPathFromUrl(url) {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url.startsWith('/') ? url : '/' + url}`);
      return urlObj.pathname;
    } catch (e) {
      return url || '';
    }
  }

  /**
   * Extracts query parameters from URL
   * @param {string} url - URL string
   * @returns {Object} Query parameters as key-value pairs
   */
  extractQueryParams(url) {
    if (!url) return {};
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url.startsWith('/') ? url : '/' + url}`);
      const params = {};
      for (const [key, value] of urlObj.searchParams) {
        params[key] = value;
      }
      return params;
    } catch (e) {
      return {};
    }
  }

  /**
   * Extracts headers from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {Object} Headers object
   */
  extractHeaders(rawEvent) {
    const headers = {};
    
    // Extract User-Agent from multiple possible locations
    if (rawEvent.userAgent || rawEvent.user_agent || rawEvent.request?.headers?.['user-agent']) {
      headers['user-agent'] = rawEvent.userAgent || rawEvent.user_agent || rawEvent.request?.headers?.['user-agent'];
    }
    
    // Extract Referer
    if (rawEvent.referer || rawEvent.referrer) {
      headers['referer'] = rawEvent.referer || rawEvent.referrer;
    }
    
    // Extract from request headers if available
    if (rawEvent.request?.headers && typeof rawEvent.request.headers === 'object') {
      Object.assign(headers, rawEvent.request.headers);
    }
    
    return headers;
  }

  /**
   * Extracts body from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {any} Body content
   */
  extractBody(rawEvent) {
    // Look for common body representations in raw event
    return rawEvent.request?.body || rawEvent.body || rawEvent.requestBody || rawEvent.formData || rawEvent.payload || null;
  }

  /**
   * Extracts failed auth attempts from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {number} Count of failed auth attempts
   */
  extractFailedAuthAttempts(rawEvent) {
    // Check for authentication metrics in various formats
    if (rawEvent.authenticationMetrics) {
      return rawEvent.authenticationMetrics.failedLogins || 0;
    }
    if (rawEvent.auth_metrics) {
      return rawEvent.auth_metrics.failed_logins || 0;
    }
    if (rawEvent.behavior?.failed_auth_attempts !== undefined) {
      return rawEvent.behavior.failed_auth_attempts;
    }
    if (rawEvent.behavior?.failedLogins !== undefined) {
      return rawEvent.behavior.failedLogins;
    }
    if (rawEvent.behavior && typeof rawEvent.behavior === 'object') {
      // Look for any property that sounds like failed auth attempts
      for (const [key, value] of Object.entries(rawEvent.behavior)) {
        if (key.toLowerCase().includes('failed') && key.toLowerCase().includes('auth')) {
          return value;
        }
      }
    }
    if (rawEvent.securityEvents && Array.isArray(rawEvent.securityEvents)) {
      return rawEvent.securityEvents.filter(event => 
        event.type && event.type.toLowerCase().includes('failed')
      ).length;
    }
    return 0;
  }

  /**
   * Extracts request count from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {number} Request count
   */
  extractRequestCount(rawEvent) {
    if (rawEvent.apiMetrics) {
      return rawEvent.apiMetrics.totalRequests || 0;
    }
    if (rawEvent.api_metrics) {
      return rawEvent.api_metrics.total_requests || 0;
    }
    if (rawEvent.behavior?.request_count !== undefined) {
      return rawEvent.behavior.request_count;
    }
    if (rawEvent.requestCount) {
      return rawEvent.requestCount || 0;
    }
    return 0;
  }

  /**
   * Extracts rate violation count from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {number} Rate violation count
   */
  extractRateViolations(rawEvent) {
    if (rawEvent.apiMetrics) {
      return rawEvent.apiMetrics.rateLimitHits || 0;
    }
    if (rawEvent.api_metrics) {
      return rawEvent.api_metrics.rate_limit_hits || 0;
    }
    if (rawEvent.behavior?.rate_violation_count !== undefined) {
      return rawEvent.behavior.rate_violation_count;
    }
    if (rawEvent.rateLimitHits) {
      return rawEvent.rateLimitHits || 0;
    }
    return 0;
  }

  /**
   * Extracts interaction rate from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {number} Interaction rate
   */
  extractInteractionRate(rawEvent) {
    if (rawEvent.userBehavior) {
      const duration = rawEvent.sessionDuration || 1000; // Default to 1 second
      const interactions = rawEvent.userBehavior.mouseClicks || 0 + rawEvent.userBehavior.keystrokes || 0;
      return duration > 0 ? interactions / (duration / 1000) : 0; // Interactions per second
    }
    if (rawEvent.user_behavior) {
      const duration = rawEvent.session_duration || 1000;
      const interactions = rawEvent.user_behavior.mouse_clicks || 0 + rawEvent.user_behavior.key_strokes || 0;
      return duration > 0 ? interactions / (duration / 1000) : 0;
    }
    if (rawEvent.behavior?.interaction_rate !== undefined) {
      return rawEvent.behavior.interaction_rate;
    }
    return 0;
  }

  /**
   * Extracts idle time from raw event
   * @param {Object} rawEvent - Raw event object
   * @returns {number} Idle time in milliseconds
   */
  extractIdleTime(rawEvent) {
    if (rawEvent.userBehavior && rawEvent.userBehavior.idleTime !== undefined) {
      return rawEvent.userBehavior.idleTime;
    }
    if (rawEvent.user_behavior && rawEvent.user_behavior.idle_time !== undefined) {
      return rawEvent.user_behavior.idle_time;
    }
    if (rawEvent.behavior?.idle_time !== undefined) {
      return rawEvent.behavior.idle_time;
    }
    return 0;
  }

  /**
   * Extracts all payloads from raw event with location context
   * @param {Object} rawEvent - Raw event object
   * @returns {Array} Array of payload objects with location and value
   */
  extractAllPayloads(rawEvent) {
    const payloads = [];

    // Extract URL query parameters
    if (rawEvent.request?.query_params) {
      for (const [key, value] of Object.entries(rawEvent.request.query_params)) {
        if (value && typeof value === 'string') {
          payloads.push({ location: `request.query_params.${key}`, value: value });
        }
      }
    }

    // Extract from URL query params if they exist in the URL string
    if (rawEvent.url) {
      try {
        const urlObj = new URL(rawEvent.url.startsWith('http') ? rawEvent.url : `http://example.com${rawEvent.url.startsWith('/') ? rawEvent.url : '/' + rawEvent.url}`);
        for (const [key, value] of urlObj.searchParams) {
          if (value && typeof value === 'string') {
            payloads.push({ location: `query.${key}`, value: value });
          }
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    }

    // Extract request body
    if (rawEvent.request?.body && typeof rawEvent.request.body === 'object') {
      this.extractPayloadsFromObject(rawEvent.request.body, 'request.body', payloads);
    } else if (rawEvent.request?.body && typeof rawEvent.request.body === 'string') {
      payloads.push({ location: 'request.body', value: rawEvent.request.body });
    }

    // Extract from main body if available
    if (rawEvent.body && typeof rawEvent.body === 'object') {
      this.extractPayloadsFromObject(rawEvent.body, 'body', payloads);
    } else if (rawEvent.body && typeof rawEvent.body === 'string') {
      payloads.push({ location: 'body', value: rawEvent.body });
    }

    // Extract form data if present
    if (rawEvent.formData && typeof rawEvent.formData === 'object') {
      this.extractPayloadsFromObject(rawEvent.formData, 'formData', payloads);
    }

    // Extract headers
    if (rawEvent.headers && typeof rawEvent.headers === 'object') {
      for (const [key, value] of Object.entries(rawEvent.headers)) {
        if (value && typeof value === 'string') {
          payloads.push({ location: `header.${key}`, value: value });
        }
      }
    }

    // Extract user agent
    if (rawEvent.userAgent || rawEvent.user_agent) {
      const userAgent = rawEvent.userAgent || rawEvent.user_agent;
      payloads.push({ location: 'header.user-agent', value: userAgent });
    }

    // Extract security events metadata
    if (rawEvent.securityEvents && Array.isArray(rawEvent.securityEvents)) {
      for (let i = 0; i < rawEvent.securityEvents.length; i++) {
        const secEvent = rawEvent.securityEvents[i];
        if (secEvent.metadata && typeof secEvent.metadata === 'object') {
          this.extractPayloadsFromObject(secEvent.metadata, `security.${i}.metadata`, payloads);
        }
        if (secEvent.description && typeof secEvent.description === 'string') {
          payloads.push({ location: `security.${i}.description`, value: secEvent.description });
        }
      }
    }

    // Extract authentication metrics
    if (rawEvent.authenticationMetrics) {
      const auth = rawEvent.authenticationMetrics;
      if (auth.suspiciousLogins && Array.isArray(auth.suspiciousLogins)) {
        for (let i = 0; i < auth.suspiciousLogins.length; i++) {
          const login = auth.suspiciousLogins[i];
          if (login.username && typeof login.username === 'string') {
            payloads.push({ location: `auth.suspicious.${i}.username`, value: login.username });
          }
          if (login.ip && typeof login.ip === 'string') {
            payloads.push({ location: `auth.suspicious.${i}.ip`, value: login.ip });
          }
        }
      }
    }

    // Extract network events
    if (rawEvent.networkEvents && Array.isArray(rawEvent.networkEvents)) {
      for (let i = 0; i < rawEvent.networkEvents.length; i++) {
        const netEvent = rawEvent.networkEvents[i];
        if (netEvent.url && typeof netEvent.url === 'string') {
          payloads.push({ location: `network.${i}.url`, value: netEvent.url });
        }
        if (netEvent.body && typeof netEvent.body === 'string') {
          payloads.push({ location: `network.${i}.body`, value: netEvent.body });
        }
      }
    }

    // Extract error events
    if (rawEvent.errorEvents && Array.isArray(rawEvent.errorEvents)) {
      for (let i = 0; i < rawEvent.errorEvents.length; i++) {
        const errorEvent = rawEvent.errorEvents[i];
        if (errorEvent.message && typeof errorEvent.message === 'string') {
          payloads.push({ location: `error.${i}.message`, value: errorEvent.message });
        }
        if (errorEvent.stack && typeof errorEvent.stack === 'string') {
          payloads.push({ location: `error.${i}.stack`, value: errorEvent.stack });
        }
      }
    }

    return payloads;
  }

  /**
   * Recursively extracts payloads from an object
   * @param {Object} obj - Object to extract payloads from
   * @param {string} prefix - Prefix for location path
   * @param {Array} payloads - Array to add payloads to
   */
  extractPayloadsFromObject(obj, prefix, payloads) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const location = `${prefix}.${key}`;
      if (typeof value === 'string') {
        payloads.push({ location: location, value: value });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractPayloadsFromObject(value, location, payloads);
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const itemLocation = `${location}[${i}]`;
          if (typeof value[i] === 'string') {
            payloads.push({ location: itemLocation, value: value[i] });
          } else if (typeof value[i] === 'object' && value[i] !== null) {
            this.extractPayloadsFromObject(value[i], itemLocation, payloads);
          }
        }
      }
    }
  }

  /**
   * Validates the required fields in a raw event
   * @param {Object} rawEvent - Raw event to validate
   * @returns {boolean} True if event has required fields
   */
  validateEvent(rawEvent) {
    // Basic validation - at least some data should be present
    return rawEvent && (rawEvent.sessionId || rawEvent.session_id || rawEvent.serverId || rawEvent.server_id);
  }
}

export default EventAdapter;