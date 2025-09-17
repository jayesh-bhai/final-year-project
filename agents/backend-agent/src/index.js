// backend-agent/index.js

const MODE = "prototype"; // "prototype" | "real"

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function collectBackendFeatures(req) {
  if (MODE === "prototype") {
    // Prototype (Synthetic) values
    return {
      failed_login_attempts: getRandomInt(0, 5),
      unusual_sql_queries: getRandomInt(0, 1),
      response_time: getRandomInt(50, 2000), // ms
      server_error_rate: getRandomInt(0, 10),
      request_rate: getRandomInt(10, 200), // per minute
      unusual_http_methods: getRandomInt(0, 1),
      ip_reputation_score: getRandomInt(0, 100),
      brute_force_signatures: getRandomInt(0, 1),
      suspicious_file_uploads: getRandomInt(0, 1)
    };
  } else {
    // Real Tracking (example hooks)
    return {
      failed_login_attempts: req.failedLogins || 0, // track via auth middleware
      unusual_sql_queries: req.query && /UNION|SELECT|DROP/i.test(req.query.sql) ? 1 : 0,
      response_time: req.responseTime || 0,
      server_error_rate: req.errorCount || 0,
      request_rate: req.requestCount || 0,
      unusual_http_methods: ["PUT", "DELETE", "TRACE"].includes(req.method) ? 1 : 0,
      ip_reputation_score: 0, // integrate with external IP reputation API
      brute_force_signatures: req.bruteForceFlag || 0,
      suspicious_file_uploads: req.file && req.file.mimetype !== "image/png" ? 1 : 0
    };
  }
}

function sendToBackend(features) {
  fetch("http://localhost:5000/api/collect/backend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features)
  });
}

// Express Middleware Example
export function backendAgentMiddleware(req, res, next) {
  const features = collectBackendFeatures(req);
  console.log("Backend Features:", features);
  sendToBackend(features);
  next();
}