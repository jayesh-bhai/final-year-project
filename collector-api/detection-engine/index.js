// Detection Engine Module
// Implements the core detection logic for SentinelWeb
// Orchestrates the four separate modules: EventAdapter, RuleEngine, ThreatScorer, and Persistence

import { EventAdapter } from './EventAdapter.js';
import { RuleEngine } from './RuleEngine.js';
import { ThreatScorer } from './ThreatScorer.js';
import { Persistence } from './Persistence.js';
import { StateManager } from './StateManager.js';

export class DetectionEngine {
  constructor() {
    this.eventAdapter = new EventAdapter();
    this.ruleEngine = new RuleEngine();
    this.threatScorer = new ThreatScorer();
    this.persistence = new Persistence();
    this.stateManager = new StateManager();

  }

  async initialize() {
    // Initialize all modules
    await this.ruleEngine.initialize();
    await this.persistence.initialize();
    await this.threatScorer.checkMLService(); // Check if ML service is available
    
    console.log('🛡️ Detection Engine initialized');
    console.log('📊 Loaded', this.ruleEngine.getRules().length, 'rules');
    console.log('💾 Database connected');
    console.log('🤖 ML Service:', this.threatScorer.mlEnabled ? 'ENABLED' : 'DISABLED');
  }

  // Main detection method - entry point for the detection engine
  async processEvent(rawEvent) {
    try {
      // Validate event
      if (!this.eventAdapter.validateEvent(rawEvent)) {
        throw new Error('Invalid event: missing required fields');
      }

      // Store raw event
      await this.persistence.storeRawEvent(rawEvent);

      // Normalize the event
      const normalizedEvent = this.eventAdapter.normalizeEvent(rawEvent);

      // Run rule-based detection
      const ruleHits = await this.ruleEngine.runRuleEngine(normalizedEvent);

      const statefulHit = this.stateManager.recordEvent(normalizedEvent);

      if (statefulHit) {
        ruleHits.push(statefulHit);
      }
      
      // Run threat scoring
      const threatAssessment = await this.threatScorer.runThreatScoring(ruleHits, normalizedEvent);

      // Generate alerts if threat detected
      if (threatAssessment.is_threat) {
        await this.generateAlert(threatAssessment, normalizedEvent, ruleHits);
      }

      return threatAssessment;
    } catch (error) {
      console.error('❌ Error in detection engine:', error);
      return {
        is_threat: false,
        threat_type: 'PROCESSING_ERROR',
        severity: 'HIGH',
        confidence: 'LOW',
        explanation: `Error processing event: ${error.message}`
      };
    }
  }

  async generateAlert(threatAssessment, normalizedEvent, ruleHits) {
    // Create alert record with structured information
    const alertData = {
      session_id: normalizedEvent.actor.session_id,
      server_id: normalizedEvent.actor.server_id || 'unknown',
      threat_type: threatAssessment.threat_type,
      severity: threatAssessment.severity,
      confidence: threatAssessment.confidence,
      explanation: threatAssessment.explanation,
      rule_hits: JSON.stringify(ruleHits), // Store structured rule evidence
      offending_payload: this.extractOffendingPayload(ruleHits),
      matched_location: this.extractMatchedLocation(ruleHits),
      timestamp: new Date().toISOString()
    };

    // Store in database
    await this.persistence.storeAlert(alertData);
  }

  extractOffendingPayload(ruleHits) {
    // Extract the first offending payload from evidence for alert storage
    if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      const firstEvidence = ruleHits[0].evidence[0];
      if (firstEvidence.value) {
        // If it's an array (like payloads), get the first value
        if (Array.isArray(firstEvidence.value)) {
          if (firstEvidence.value.length > 0 && firstEvidence.value[0].value) {
            return firstEvidence.value[0].value;
          }
        } else {
          return String(firstEvidence.value);
        }
      }
    }
    return 'No specific payload identified';
  }

  extractMatchedLocation(ruleHits) {
    // Extract the location where the first match occurred
    if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
      return ruleHits[0].evidence[0].field || 'unknown';
    }
    return 'unknown';
  }

  async getAlerts(limit = 50) {
    // Retrieve recent alerts from database
    return await this.persistence.getAlerts(limit);
  }

  async getRawEvents(limit = 50) {
    // Retrieve recent raw events from database
    return await this.persistence.getRawEvents(limit);
  }
}

export default DetectionEngine;