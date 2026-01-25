/**
 * Threat Scorer Module
 * Purpose: Convert rule hits and normalized events into threat decisions
 * Input: rule hits + normalized event
 * Output: threat decision object
 * ML can only modify confidence
 */

export class ThreatScorer {
  constructor(mlApiUrl = 'http://localhost:8000/predict') {
    this.mlApiUrl = mlApiUrl;
    this.mlEnabled = false;
  }

  /**
   * Runs threat scoring logic based on rule hits and optional ML input
   * @param {Array} ruleHits - Array of rule hits from RuleEngine
   * @param {Object} normalizedEvent - Normalized event object
   * @returns {Object} Threat assessment object
   */
  async runThreatScoring(ruleHits, normalizedEvent) {
    // Default values
    let is_threat = false;
    let threat_type = 'NONE';
    let severity = 'LOW';
    let confidence = 'LOW';
    let explanation = 'No threats detected';

    // Get highest severity from rule hits
    const highSeverityHits = ruleHits.filter(hit => hit.severity === 'HIGH');
    const mediumSeverityHits = ruleHits.filter(hit => hit.severity === 'MEDIUM');
    const lowSeverityHits = ruleHits.filter(hit => hit.severity === 'LOW');

    // Apply threat logic - rules determine if there's a threat
    if (highSeverityHits.length > 0) {
      is_threat = true;
      threat_type = highSeverityHits[0].rule_id || 'UNKNOWN';
      severity = 'HIGH';
      confidence = 'HIGH';
      explanation = this.generateExplanation(highSeverityHits, 'High severity threat detected');
    } else if (mediumSeverityHits.length >= 2) { // Multiple medium rules
      is_threat = true;
      threat_type = mediumSeverityHits[0].rule_id || 'UNKNOWN';
      severity = 'MEDIUM';
      confidence = 'MEDIUM';
      explanation = this.generateExplanation(mediumSeverityHits, 'Multiple medium severity threats detected');
    } else if (lowSeverityHits.length > 0) {
      // Only low severity rules - not considered a threat
      is_threat = false;
      threat_type = lowSeverityHits[0].rule_id || 'UNKNOWN';
      severity = 'LOW';
      confidence = 'LOW';
      explanation = this.generateExplanation(lowSeverityHits, 'Low severity anomalies detected, but not considered a threat');
    }

    // If ML is enabled, get anomaly score and adjust confidence based on ML input
    if (this.mlEnabled) {
      try {
        const mlScore = await this.getMLAnomalyScore(normalizedEvent);
        
        // ML can only modify confidence, not create threats
        if (is_threat) {
          // If threat exists, ML can increase or decrease confidence
          if (mlScore > 0.8) {
            // High ML score increases confidence in threat
            if (confidence === 'MEDIUM') confidence = 'HIGH';
            explanation += ` ML model confirms anomalous behavior (score: ${mlScore.toFixed(2)}).`;
          } else if (mlScore < 0.3) {
            // Low ML score decreases confidence in threat
            if (confidence === 'HIGH') confidence = 'MEDIUM';
            else if (confidence === 'MEDIUM') confidence = 'LOW';
            explanation += ` ML model suggests normal behavior (score: ${mlScore.toFixed(2)}), reducing confidence.`;
          }
        } else {
          // No threat from rules, ML cannot create a threat
          // But we can mention ML score for informational purposes
          explanation += ` ML model score: ${mlScore.toFixed(2)} (not creating threat).`;
        }
      } catch (error) {
        console.error('Error getting ML score:', error);
        // Continue with rule-based results
      }
    }

    return {
      is_threat,
      threat_type,
      severity,
      confidence,
      explanation,
      rule_hits_count: ruleHits.length
    };
  }

  /**
   * Generates explanation based on rule hits
   * @param {Array} ruleHits - Array of rule hits
   * @param {string} baseMessage - Base message to start explanation
   * @returns {string} Generated explanation
   */
  generateExplanation(ruleHits, baseMessage) {
    if (ruleHits.length === 0) {
      return baseMessage;
    }

    let explanation = `${baseMessage}: ${ruleHits[0].rule_id}. ${ruleHits.length} rule(s) triggered.`;

    // Add details about evidence if available
    if (ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      const evidence = ruleHits[0].evidence[0];
      if (evidence.field && evidence.value) {
        explanation += ` Evidence found in "${evidence.field}" with value "${this.truncateValue(evidence.value)}".`;
      }
    }

    return explanation;
  }

  /**
   * Truncates a value for display in explanation
   * @param {*} value - Value to truncate
   * @returns {string} Truncated string representation
   */
  truncateValue(value) {
    let strValue;
    if (Array.isArray(value)) {
      if (value.length > 0 && value[0].value) {
        strValue = value[0].value;
      } else {
        strValue = JSON.stringify(value);
      }
    } else {
      strValue = String(value);
    }

    // Truncate to 50 characters max
    return strValue.length > 50 ? strValue.substring(0, 50) + '...' : strValue;
  }

  /**
   * Gets anomaly score from ML service
   * @param {Object} normalizedEvent - Normalized event to analyze
   * @returns {Number} Anomaly score between 0 and 1
   */
  async getMLAnomalyScore(normalizedEvent) {
    // Call the ML service to get anomaly score
    // This should be non-blocking with timeout
    try {
      // Prepare features for the ML model
      const features = this.prepareFeatures(normalizedEvent);
      
      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(this.mlApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        return result.score || 0.5; // Default to 0.5 if no score returned
      } else {
        console.log('ML API returned error, using default score');
        return 0.5;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('ML API call timed out, using default score');
      } else {
        console.log('ML API call failed, using default score');
      }
      return 0.5; // Default score if ML service unavailable
    }
  }

  /**
   * Prepares features for ML model from normalized event
   * @param {Object} normalizedEvent - Normalized event to extract features from
   * @returns {Array} Array of numerical features
   */
  prepareFeatures(normalizedEvent) {
    // Extract numerical features for the ML model
    const features = [
      // Behavioral features
      normalizedEvent.behavior?.interaction_rate || 0,
      normalizedEvent.behavior?.request_count || 0,
      normalizedEvent.behavior?.failed_auth_attempts || 0,
      normalizedEvent.behavior?.rate_violation_count || 0,
      normalizedEvent.behavior?.idle_time || 0,
      
      // Actor information
      normalizedEvent.actor?.session_id ? 1 : 0, // Presence of session
      
      // Request information
      normalizedEvent.request?.method ? normalizedEvent.request.method.length : 0,
      
      // Time-based features
      normalizedEvent.timestamp % 86400000, // Time of day in milliseconds
    ];
    
    return features;
  }

  /**
   * Checks if ML service is available
   */
  async checkMLService() {
    // Simple check to see if ML service is available
    try {
      const response = await fetch(this.mlApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: [] })
      });
      
      if (response.ok) {
        this.mlEnabled = true;
        console.log('🤖 ML Service is available');
      } else {
        console.log('🤖 ML Service not available - running in rules-only mode');
      }
    } catch (error) {
      console.log('🤖 ML Service not available - running in rules-only mode');
    }
  }

  /**
   * Sets ML availability status
   * @param {Boolean} enabled - Whether ML is enabled
   */
  setMLEnabled(enabled) {
    this.mlEnabled = enabled;
  }
}

export default ThreatScorer;