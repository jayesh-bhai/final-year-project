/**
 * Detailed Adversarial Validation Test Script
 * Tests the Detection Engine with 6 canonical events with detailed tracing
 */

import { EventAdapter } from './EventAdapter.js';
import { RuleEngine } from './RuleEngine.js';
import { ThreatScorer } from './ThreatScorer.js';
import { Persistence } from './Persistence.js';

async function runDetailedValidationTests() {
  console.log('🛡️ Starting Detailed Adversarial Validation Tests...\n');

  // Initialize individual components
  const eventAdapter = new EventAdapter();
  const ruleEngine = new RuleEngine();
  const threatScorer = new ThreatScorer();
  const persistence = new Persistence();
  
  await ruleEngine.initialize();
  await persistence.initialize();

  // Define the 6 canonical test events
  const testEvents = {
    E1: {
      "event_type": "http_request",
      "source": "frontend",
      "timestamp": 1710000000000,
      "session_id": "sess_sqli_1",
      "ip": "192.168.1.10",
      "user_agent": "Mozilla/5.0",
      "request": {
        "method": "POST",
        "path": "/login",
        "headers": {
          "content-type": "application/json"
        },
        "body": {
          "username": "admin",
          "password": "' OR 1=1 --"
        }
      }
    },
    E2: {
      "event_type": "auth_summary",
      "source": "backend",
      "timestamp": 1710000100000,
      "session_id": "sess_brute_1",
      "ip": "192.168.1.20",
      "behavior": {
        "failed_auth_attempts": 7,
        "successful_auth_attempts": 0
      }
    },
    E3: {
      "event_type": "api_usage",
      "source": "backend",
      "timestamp": 1710000200000,
      "session_id": "sess_rate_1",
      "ip": "192.168.1.30",
      "behavior": {
        "request_count": 120,
        "rate_violation_count": 6
      }
    },
    E4: {
      "event_type": "auth_summary",
      "source": "backend",
      "timestamp": 1710000300000,
      "session_id": "sess_ok_1",
      "ip": "192.168.1.40",
      "behavior": {
        "failed_auth_attempts": 2,
        "successful_auth_attempts": 1
      }
    },
    E5: {
      "event_type": "http_request",
      "source": "frontend",
      "timestamp": 1710000400000,
      "session_id": "sess_search_1",
      "ip": "192.168.1.50",
      "request": {
        "method": "GET",
        "path": "/search",
        "query_params": {
          "q": "how to use UNION SELECT in mysql"
        }
      }
    },
    E6: {
      "event_type": "user_activity",
      "source": "frontend",
      "timestamp": 1710000500000,
      "session_id": "sess_power_1",
      "ip": "192.168.1.60",
      "behavior": {
        "interaction_rate": 95,
        "idle_time": 12000,
        "request_count": 80
      }
    }
  };

  // Test each event individually with detailed tracing
  for (const [eventId, rawEvent] of Object.entries(testEvents)) {
    console.log(`\n🔬 TESTING EVENT ${eventId}`);
    console.log(`=========================================`);

    try {
      console.log('\n📥 Raw Input Event:');
      console.log(JSON.stringify(rawEvent, null, 2));

      // A. Test Adapter Stage
      console.log('\n📊 A. ADAPTER STAGE ANALYSIS:');
      console.log('-----------------------------');
      const normalizedEvent = eventAdapter.normalizeEvent(rawEvent);
      
      console.log('Normalized Event Structure:');
      console.log(`  - event_type: ${normalizedEvent.event_type}`);
      console.log(`  - source: ${normalizedEvent.source}`);
      console.log(`  - timestamp: ${normalizedEvent.timestamp}`);
      console.log('  - actor: {');
      console.log(`      ip: ${normalizedEvent.actor?.ip}`);
      console.log(`      user_id: ${normalizedEvent.actor?.user_id}`);
      console.log(`      session_id: ${normalizedEvent.actor?.session_id}`);
      console.log('    }');
      console.log('  - request: {');
      console.log(`      method: ${normalizedEvent.request?.method}`);
      console.log(`      path: ${normalizedEvent.request?.path}`);
      console.log(`      query_params: ${JSON.stringify(normalizedEvent.request?.query_params)}`);
      console.log(`      headers: ${JSON.stringify(normalizedEvent.request?.headers)}`);
      console.log(`      body: ${JSON.stringify(normalizedEvent.request?.body)}`);
      console.log('    }');
      console.log('  - behavior: {');
      console.log(`      failed_auth_attempts: ${normalizedEvent.behavior?.failed_auth_attempts}`);
      console.log(`      request_count: ${normalizedEvent.behavior?.request_count}`);
      console.log(`      rate_violation_count: ${normalizedEvent.behavior?.rate_violation_count}`);
      console.log(`      interaction_rate: ${normalizedEvent.behavior?.interaction_rate}`);
      console.log(`      idle_time: ${normalizedEvent.behavior?.idle_time}`);
      console.log('    }');
      console.log(`  - payloads: ${normalizedEvent.payloads?.length} items`);
      if (normalizedEvent.payloads && normalizedEvent.payloads.length > 0) {
        console.log('    Payload details:');
        for (let i = 0; i < Math.min(3, normalizedEvent.payloads.length); i++) {
          const p = normalizedEvent.payloads[i];
          console.log(`      [${i}] location: "${p.location}", value: "${p.value}"`);
        }
        if (normalizedEvent.payloads.length > 3) {
          console.log(`      ... and ${normalizedEvent.payloads.length - 3} more`);
        }
      }

      // B. Test Rule Engine Stage
      console.log('\n📊 B. RULE ENGINE STAGE ANALYSIS:');
      console.log('----------------------------------');
      const ruleHits = await ruleEngine.runRuleEngine(normalizedEvent);
      
      console.log(`Rule Hits Found: ${ruleHits.length}`);
      if (ruleHits.length > 0) {
        for (let i = 0; i < ruleHits.length; i++) {
          const hit = ruleHits[i];
          console.log(`  Rule Hit #${i + 1}:`);
          console.log(`    - rule_id: ${hit.rule_id}`);
          console.log(`    - severity: ${hit.severity}`);
          console.log(`    - evidence count: ${hit.evidence.length}`);
          for (let j = 0; j < hit.evidence.length; j++) {
            const evidence = hit.evidence[j];
            console.log(`      Evidence #${j + 1}: field="${evidence.field}", value="${evidence.value}", operator="${evidence.operator}", expected="${evidence.expected}"`);
          }
        }
      } else {
        console.log('  No rules fired');
        console.log('  Checking rule conditions against event...');
        
        // Let's manually check what rules exist and why they didn\'t match
        const rules = ruleEngine.getRules();
        console.log(`  Total rules: ${rules.length}`);
        for (const rule of rules) {
          console.log(`  Rule: ${rule.rule_id} (severity: ${rule.severity})`);
          for (const condition of rule.conditions || []) {
            console.log(`    Condition: ${condition.field} ${condition.operator} ${condition.value}`);
            // Get the field value to see why it didn't match
            const fieldValue = getNestedValue(normalizedEvent, condition.field);
            console.log(`      Actual field value: ${JSON.stringify(fieldValue)}`);
            
            // Try to evaluate the condition manually
            let matchResult = false;
            if (condition.operator === 'regex' && condition.value && fieldValue) {
              try {
                const regex = new RegExp(condition.value, 'i');
                if (Array.isArray(fieldValue)) {
                  matchResult = fieldValue.some(item => 
                    item && item.value && regex.test(item.value)
                  );
                } else {
                  matchResult = regex.test(String(fieldValue));
                }
              } catch (e) {
                console.log(`      Regex error: ${e.message}`);
              }
            } else if (condition.operator === '>' && typeof fieldValue === 'number') {
              matchResult = fieldValue > condition.value;
            } else if (condition.operator === '<' && typeof fieldValue === 'number') {
              matchResult = fieldValue < condition.value;
            }
            console.log(`      Condition result: ${matchResult}`);
          }
        }
      }

      // C. Test Threat Scorer Stage
      console.log('\n📊 C. THREAT SCORER STAGE ANALYSIS:');
      console.log('-----------------------------------');
      const threatResult = await threatScorer.runThreatScoring(ruleHits, normalizedEvent);
      
      console.log(`Threat Assessment:`);
      console.log(`  - is_threat: ${threatResult.is_threat}`);
      console.log(`  - threat_type: ${threatResult.threat_type}`);
      console.log(`  - severity: ${threatResult.severity}`);
      console.log(`  - confidence: ${threatResult.confidence}`);
      console.log(`  - explanation: ${threatResult.explanation}`);
      console.log(`  - rule_hits_count: ${threatResult.rule_hits_count}`);

      // D. Test Persistence Stage
      console.log('\n📊 D. PERSISTENCE STAGE ANALYSIS:');
      console.log('----------------------------------');
      // Store raw event
      await persistence.storeRawEvent(rawEvent);
      
      if (threatResult.is_threat) {
        // Create and store alert
        const alertData = {
          session_id: normalizedEvent.actor.session_id,
          server_id: normalizedEvent.actor.server_id || 'unknown',
          threat_type: threatResult.threat_type,
          severity: threatResult.severity,
          confidence: threatResult.confidence,
          explanation: threatResult.explanation,
          rule_hits: JSON.stringify(ruleHits),
          offending_payload: extractOffendingPayload(ruleHits),
          matched_location: extractMatchedLocation(ruleHits),
          timestamp: new Date().toISOString()
        };
        
        await persistence.storeAlert(alertData);
        console.log('  - ALERT STORED: YES');
        console.log(`  - Alert session: ${alertData.session_id}`);
        console.log(`  - Alert severity: ${alertData.severity}`);
      } else {
        console.log('  - ALERT STORED: NO (correctly)');
      }

      // Final summary
      console.log('\n📋 FINAL SUMMARY FOR EVENT ' + eventId + ':');
      console.log(`   - Input: ${eventId} (${eventId === 'E1' || eventId === 'E2' || eventId === 'E3' ? 'malicious' : 'benign'})`);
      console.log(`   - Threat Detected: ${threatResult.is_threat}`);
      console.log(`   - Expected: ${eventId === 'E1' || eventId === 'E2' || eventId === 'E3' ? 'YES' : 'NO'}`);
      console.log(`   - Result: ${threatResult.is_threat ? (eventId === 'E1' || eventId === 'E2' || eventId === 'E3' ? '✅ CORRECT (malicious event flagged)' : '❌ INCORRECT (false positive)') : 
                                (eventId === 'E1' || eventId === 'E2' || eventId === 'E3' ? '❌ INCORRECT (missed threat)' : '✅ CORRECT (benign event passed)')}`);

    } catch (error) {
      console.log(`\n❌ ERROR PROCESSING EVENT ${eventId}:`, error.message);
      console.error(error.stack);
    }

    console.log('\n');
  }

  console.log('🏁 Detailed Adversarial Validation Tests Complete!');
}

// Helper function to get nested values from objects using dot notation
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    value = value[key];
  }
  
  return value;
}

// Helper functions for extracting alert data
function extractOffendingPayload(ruleHits) {
  if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
    const firstEvidence = ruleHits[0].evidence[0];
    if (firstEvidence.value) {
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

function extractMatchedLocation(ruleHits) {
  if (ruleHits.length > 0 && ruleHits[0].evidence && ruleHits[0].evidence.length > 0) {
    return ruleHits[0].evidence[0].field || 'unknown';
  }
  return 'unknown';
}

// Run the validation
runDetailedValidationTests().catch(console.error);

export { runDetailedValidationTests };