export class StateManager {
  constructor() {
    // 🧠 Tracking the failures
    this.ipFailures = new Map();
    this.sessionFailures = new Map();
    
    // ⏳ Tracking the cooldowns (so we don't spam alerts)
    this.ipAlerts = new Map();
    this.sessionAlerts = new Map();
    
    this.windowSeconds = 60;
    this.threshold = 5;
  }

  recordEvent(event) {
    if (!event.actor || (!event.actor.ip && !event.actor.session_id)) return null;

    // Only process login attempts
    if (event.event_type !== "login_attempt") return null;

    const now = event.timestamp;
    const ip = event.actor.ip;
    const session = event.actor.session_id;

    const isSuccess = event.behavior && event.behavior.successful_auth_attempts > 0;
    const isFailure = event.behavior && event.behavior.failed_auth_attempts > 0;

    // 1️⃣ SUCCESS RESET: If they log in successfully, clear their failure history
    if (isSuccess) {
      if (ip) this.ipFailures.delete(ip);
      if (session) this.sessionFailures.delete(session);
      return null; 
    }

    if (!isFailure) return null;

    // Record the failure
    if (ip) this.addFailure(this.ipFailures, ip, now);
    if (session) this.addFailure(this.sessionFailures, session, now);

    const ipCount = ip ? this.countRecent(this.ipFailures, ip, now) : 0;
    const sessionCount = session ? this.countRecent(this.sessionFailures, session, now) : 0;

    // Check if they are currently on cooldown (already triggered an alert recently)
    const ipOnCooldown = ip && this.isOnCooldown(this.ipAlerts, ip, now);
    const sessionOnCooldown = session && this.isOnCooldown(this.sessionAlerts, session, now);

    // 2️⃣ POST-TRIGGER COOLDOWN: Only trigger if threshold is met AND they aren't on cooldown
    if ((ipCount >= this.threshold && !ipOnCooldown) || 
        (sessionCount >= this.threshold && !sessionOnCooldown)) {
        
      // Mark them as alerted to start the 60-second cooldown timer
      if (ipCount >= this.threshold && ip) this.ipAlerts.set(ip, now);
      if (sessionCount >= this.threshold && session) this.sessionAlerts.set(session, now);

      return {
        rule_id: "BRUTE_FORCE_STATEFUL",
        severity: "HIGH",
        evidence: [
          { field: "actor.ip", value: ip },
          { field: "actor.session_id", value: session },
          { field: "failure_count", value: Math.max(ipCount, sessionCount) },
          { field: "window_seconds", value: this.windowSeconds }
        ],
        timestamp: Date.now()
      };
    }

    return null;
  }

  addFailure(map, key, timestamp) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(timestamp);
  }

  countRecent(map, key, now) {
    if (!key || !map.has(key)) return 0;

    const cutoff = now - this.windowSeconds * 1000;
    const recent = map.get(key).filter(ts => ts >= cutoff);
    map.set(key, recent);
    return recent.length;
  }
  
  isOnCooldown(map, key, now) {
    if (!key || !map.has(key)) return false;
    
    const lastAlertTime = map.get(key);
    const cutoff = now - this.windowSeconds * 1000;
    
    // If the last alert was within the 60-second window, they are on cooldown
    if (lastAlertTime >= cutoff) {
      return true;
    } else {
      // Time's up! Remove the cooldown
      map.delete(key);
      return false;
    }
  }
}