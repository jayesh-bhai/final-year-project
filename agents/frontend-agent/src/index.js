// frontend-agent/index.js

const MODE = "prototype"; // "prototype" | "real"

// Utility to simulate random values (for prototype mode)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Collect Features
function collectFrontendFeatures() {
  if (MODE === "prototype") {
    // Prototype (Synthetic) values
    return {
      session_duration: getRandomInt(1, 300), // seconds
      page_navigation_rate: getRandomInt(1, 10), // clicks/minute
      input_field_activity: getRandomInt(0, 50), // keystrokes
      mouse_click_frequency: getRandomInt(0, 100), // clicks
      suspicious_input_patterns: getRandomInt(0, 1), // 0=normal, 1=suspicious
      form_submission_rate: getRandomInt(0, 5),
      csrf_token_presence: getRandomInt(0, 1),
      unusual_headers: getRandomInt(0, 1),
      client_error_rate: getRandomInt(0, 10)
    };
  } else {
    // Real Tracking
    return {
      session_duration: Math.floor(performance.now() / 1000), // actual session time
      page_navigation_rate: window.history.length, // simple proxy
      input_field_activity: document.querySelectorAll("input").length, // track keystrokes with event listeners
      mouse_click_frequency: 0, // (hook mouse click event listener & increment)
      suspicious_input_patterns: 0, // (regex check for SQLi/XSS payloads)
      form_submission_rate: 0, // (hook into form submit event)
      csrf_token_presence: document.querySelector("input[name='csrf']") ? 1 : 0,
      unusual_headers: 0, // (check headers via fetch wrapper)
      client_error_rate: 0 // (track via window.onerror or fetch intercept)
    };
  }
}

// Send Features to Backend API
function sendToBackend(features) {
  fetch("http://localhost:5000/api/collect/frontend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features)
  });
}

// Main Runner
export function startFrontendAgent(interval = 5000) {
  setInterval(() => {
    const features = collectFrontendFeatures();
    console.log("Frontend Features:", features);
    sendToBackend(features);
  }, interval);
}
