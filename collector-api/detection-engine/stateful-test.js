/**
 * Stateful Behavioral Validation Test
 * Tests the new StateManager's ability to remember and correlate events over time,
 * including success resets and cooldown spam prevention.
 */

import { DetectionEngine } from './index.js';

// Helper function to easily create login events
function createLoginEvent(ip, sessionId, timestampOffsetMs, isSuccess = false) {
  return {
    event_type: "login_attempt",
    source: "frontend",
    timestamp: Date.now() + timestampOffsetMs,
    session_id: sessionId,
    ip: ip,
    behavior: {
      failed_auth_attempts: isSuccess ? 0 : 1,
      successful_auth_attempts: isSuccess ? 1 : 0
    }
  };
}

async function runStatefulTests() {
  console.log('🧠 Starting Stateful Behavioral Tests...\n');

  // Initialize a fresh engine for testing
  const engine = new DetectionEngine();
  await engine.initialize();

  // -----------------------------------------------------------------
  // TEST 1: The Rapid Brute Force (5 failures in 40 seconds) - SHOULD TRIGGER
  // -----------------------------------------------------------------
  console.log('🧪 TEST 1: Rapid Brute Force (5 failures under 60s)');
  let threatDetected = false;
  for (let i = 0; i < 5; i++) {
    const event = createLoginEvent("10.0.0.1", "sess_bad_guy", i * 10000); 
    const result = await engine.processEvent(event);
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      threatDetected = true;
    }
  }
  console.log(`Result: ${threatDetected ? '✅ CORRECT (Threat Detected)' : '❌ INCORRECT (Missed)'}\n`);


  // -----------------------------------------------------------------
  // TEST 2: The Slow Attack (5 failures spread over 160 seconds) - SHOULD NOT TRIGGER
  // -----------------------------------------------------------------
  console.log('🧪 TEST 2: Slow Attack (5 failures spread over 2+ minutes)');
  threatDetected = false;
  for (let i = 0; i < 5; i++) {
    const event = createLoginEvent("10.0.0.2", "sess_slow_guy", i * 40000); 
    const result = await engine.processEvent(event);
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      threatDetected = true;
    }
  }
  console.log(`Result: ${!threatDetected ? '✅ CORRECT (Ignored safely)' : '❌ INCORRECT (False Positive)'}\n`);


  // -----------------------------------------------------------------
  // TEST 3: Short Burst (3 failures only) - SHOULD NOT TRIGGER
  // -----------------------------------------------------------------
  console.log('🧪 TEST 3: Short Burst (Only 3 failures)');
  threatDetected = false;
  for (let i = 0; i < 3; i++) {
    const event = createLoginEvent("10.0.0.3", "sess_clumsy_guy", i * 10000); 
    const result = await engine.processEvent(event);
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      threatDetected = true;
    }
  }
  console.log(`Result: ${!threatDetected ? '✅ CORRECT (Ignored safely)' : '❌ INCORRECT (False Positive)'}\n`);


  // -----------------------------------------------------------------
  // TEST 4: Distributed Attack (5 failures, 5 different IPs) - SHOULD NOT TRIGGER
  // -----------------------------------------------------------------
  console.log('🧪 TEST 4: Distributed Attack (Different IPs and Sessions)');
  threatDetected = false;
  for (let i = 0; i < 5; i++) {
    const event = createLoginEvent(`192.168.1.${i}`, `sess_bot_${i}`, i * 10000); 
    const result = await engine.processEvent(event);
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      threatDetected = true;
    }
  }
  console.log(`Result: ${!threatDetected ? '✅ CORRECT (Ignored safely)' : '❌ INCORRECT (False Positive)'}\n`);


  // -----------------------------------------------------------------
  // TEST 5: Success Reset Scenario - SHOULD NOT TRIGGER
  // -----------------------------------------------------------------
  console.log('🧪 TEST 5: Success Reset (4 fails -> 1 success -> 4 fails under 60s)');
  threatDetected = false;
  const ip5 = "10.0.0.5";
  const session5 = "sess_forgetful_user";
  
  // 4 failures fast
  for (let i = 0; i < 4; i++) {
    await engine.processEvent(createLoginEvent(ip5, session5, i * 5000));
  }
  // 1 success! (This should wipe the slate clean)
  await engine.processEvent(createLoginEvent(ip5, session5, 20000, true));
  
  // 4 more failures fast
  for (let i = 0; i < 4; i++) {
    const result = await engine.processEvent(createLoginEvent(ip5, session5, 25000 + (i * 5000)));
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      threatDetected = true;
    }
  }
  console.log(`Result: ${!threatDetected ? '✅ CORRECT (Count reset, ignored safely)' : '❌ INCORRECT (False Positive)'}\n`);


  // -----------------------------------------------------------------
  // TEST 6: Post-Trigger Cooldown (Spam Prevention) - SHOULD TRIGGER EXACTLY ONCE
  // -----------------------------------------------------------------
  console.log('🧪 TEST 6: Cooldown Spam Prevention (8 fails under 60s)');
  let triggerCount = 0;
  for (let i = 0; i < 8; i++) {
    // 8 failures happen quickly (5 seconds apart)
    const event = createLoginEvent("10.0.0.6", "sess_stubborn_bot", i * 5000); 
    const result = await engine.processEvent(event);
    if (result.is_threat && result.threat_type === "BRUTE_FORCE_STATEFUL") {
      triggerCount++;
    }
  }
  console.log(`Result: ${triggerCount === 1 ? '✅ CORRECT (Triggered exactly once)' : `❌ INCORRECT (Triggered ${triggerCount} times)`}\n`);

  console.log('🏁 Stateful Tests Complete!');
}

runStatefulTests().catch(console.error);