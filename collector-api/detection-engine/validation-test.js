/**
 * Adversarial Validation Test Script
 * Tests the Detection Engine with 6 canonical events
 */

import { DetectionEngine } from './index.js';

async function runValidationTests() {
  console.log('🛡️ Starting Adversarial Validation Tests...\n');

  // Initialize the detection engine
  const detectionEngine = new DetectionEngine();
  await detectionEngine.initialize();

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

  // Test each event individually
  for (const [eventId, event] of Object.entries(testEvents)) {
    console.log(`\n🔬 TESTING EVENT ${eventId}`);
    console.log(`=========================================`);

    try {
      console.log('\n📥 Raw Input Event:');
      console.log(JSON.stringify(event, null, 2));

      // Process the event through the detection engine
      const result = await detectionEngine.processEvent(event);

      console.log('\n📊 PIPELINE TRACING RESULTS:');
      console.log('\nA. Adapter Stage:');
      console.log('   - Event was accepted and processed');
      console.log('   - Event structure appears valid');

      console.log('\nB. Rule Engine Stage:');
      if (result.rule_hits_count > 0) {
        console.log('   - Rule(s) fired successfully');
        console.log(`   - ${result.rule_hits_count} rule(s) triggered`);
        // Get alerts to see which rules fired
        const alerts = await detectionEngine.getAlerts(1);
        if (alerts.length > 0) {
          console.log('   - Threat detected based on rule matches');
        }
      } else {
        console.log('   - No rules fired');
      }

      console.log('\nC. Threat Scorer Stage:');
      console.log(`   - is_threat: ${result.is_threat}`);
      console.log(`   - threat_type: ${result.threat_type}`);
      console.log(`   - severity: ${result.severity}`);
      console.log(`   - confidence: ${result.confidence}`);
      console.log(`   - explanation: ${result.explanation}`);

      console.log('\nD. Persistence Stage:');
      // Check if alert was stored
      const alerts = await detectionEngine.getAlerts(5);
      const eventAlert = alerts.find(alert => 
        alert.session_id === event.session_id || 
        (event.session_id && alert.session_id.includes(event.session_id.replace('sess_', '').split('_')[0]))
      );
      
      if (result.is_threat) {
        if (eventAlert) {
          console.log('   - Alert stored in database ✓');
          console.log(`   - Alert severity: ${eventAlert.severity}`);
          console.log(`   - Alert explanation: ${eventAlert.explanation}`);
        } else {
          console.log('   - ERROR: Threat detected but no alert stored ✗');
        }
      } else {
        console.log('   - No alert stored (correctly)');
      }

      console.log('\n📋 SUMMARY FOR EVENT ' + eventId + ':');
      console.log(`   - Input: ${eventId} (${eventId.startsWith('E1') || eventId.startsWith('E2') || eventId.startsWith('E3') ? 'malicious' : 'benign'})`);
      console.log(`   - Threat Detected: ${result.is_threat}`);
      console.log(`   - Result: ${result.is_threat ? (eventId.startsWith('E1') || eventId.startsWith('E2') || eventId.startsWith('E3') ? '✅ CORRECT (malicious event flagged)' : '❌ INCORRECT (false positive)') : 
                                (eventId.startsWith('E1') || eventId.startsWith('E2') || eventId.startsWith('E3') ? '❌ INCORRECT (missed threat)' : '✅ CORRECT (benign event passed)')}`);

    } catch (error) {
      console.log(`\n❌ ERROR PROCESSING EVENT ${eventId}:`, error.message);
    }

    console.log('\n');
  }

  console.log('🏁 Adversarial Validation Tests Complete!');
}

// Run the validation
runValidationTests().catch(console.error);

export { runValidationTests };