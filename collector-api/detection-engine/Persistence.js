/**
 * Persistence Module
 * Purpose: Handle database storage for raw events and alerts
 * Responsibilities:
 * - raw_events storage
 * - alerts storage
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Persistence {
  constructor() {
    this.db = null;
  }

  /**
   * Initializes the database connection and creates required tables
   */
  async initialize() {
    // Open SQLite database
    this.db = await open({
      filename: path.join(__dirname, '..', 'sentinelweb.db'),
      driver: sqlite3.Database
    });

    // Create required tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS raw_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        server_id TEXT,
        event_type TEXT,
        event_data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        server_id TEXT,
        threat_type TEXT,
        severity TEXT,
        confidence TEXT,
        explanation TEXT,
        rule_hits TEXT,
        offending_payload TEXT,
        matched_location TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('💾 Detection Engine database tables created');
  }

  /**
   * Stores a raw event in the database
   * @param {Object} rawEvent - Raw event to store
   */
  async storeRawEvent(rawEvent) {
    // Store the raw event in the database
    await this.db.run(
      `INSERT INTO raw_events (session_id, server_id, event_type, event_data) 
       VALUES (?, ?, ?, ?)`,
      [
        rawEvent.sessionId || rawEvent.session_id || 'unknown',
        rawEvent.serverId || rawEvent.server_id || 'unknown',
        rawEvent.event_type || 'unknown',
        JSON.stringify(rawEvent)
      ]
    );
  }

  /**
   * Stores an alert in the database
   * @param {Object} alertData - Alert data to store
   */
  async storeAlert(alertData) {
    // Create alert record
    await this.db.run(
      `INSERT INTO alerts (session_id, server_id, threat_type, severity, confidence, explanation, rule_hits, offending_payload, matched_location) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertData.session_id,
        alertData.server_id,
        alertData.threat_type,
        alertData.severity,
        alertData.confidence,
        alertData.explanation,
        alertData.rule_hits,
        alertData.offending_payload.substring(0, 100), // Truncate for storage
        alertData.matched_location
      ]
    );

    // Log to console for demo purposes
    console.log(`🚨 THREAT DETECTED [${alertData.severity}]`);
    console.log(`   Type: ${alertData.threat_type}`);
    console.log(`   Confidence: ${alertData.confidence}`);
    console.log(`   Explanation: ${alertData.explanation}`);
    console.log(`   Session: ${alertData.session_id}`);
    console.log(`   Matched Location: ${alertData.matched_location}`);
    console.log(`   Rules Triggered: ${JSON.parse(alertData.rule_hits).length}`);
  }

  /**
   * Retrieves recent alerts from the database
   * @param {Number} limit - Number of alerts to retrieve (default: 50)
   * @returns {Array} Array of alert objects
   */
  async getAlerts(limit = 50) {
    // Retrieve recent alerts from database
    const alerts = await this.db.all(
      `SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
    return alerts;
  }

  /**
   * Retrieves recent raw events from the database
   * @param {Number} limit - Number of events to retrieve (default: 50)
   * @returns {Array} Array of raw event objects
   */
  async getRawEvents(limit = 50) {
    // Retrieve recent raw events from database
    const events = await this.db.all(
      `SELECT * FROM raw_events ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
    return events;
  }

  /**
   * Closes the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default Persistence;