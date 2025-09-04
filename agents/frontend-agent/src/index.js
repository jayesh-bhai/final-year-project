class SentinelWebFrontend {
  constructor() {
    this.events = [];
  }

  start() {
    console.log("SentinelWeb Frontend Agent Started");

    // Track clicks
    document.addEventListener("click", (e) => {
      this.logEvent("click", { x: e.clientX, y: e.clientY });
    });

    // Track keystrokes
    document.addEventListener("keydown", (e) => {
      this.logEvent("keydown", { key: e.key });
    });
  }

  logEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    this.events.push(event);
    console.log("Sentinel Event:", event);
  }
}

export default SentinelWebFrontend;
