const http = require('http');

// Test sending data to Collector API frontend endpoint
console.log('Testing Collector API frontend endpoint...');
const collectorData = JSON.stringify({
  session_duration: 300,
  page_navigation_rate: 3,
  input_field_activity: 20,
  mouse_click_frequency: 25,
  suspicious_input_patterns: 0,
  form_submission_rate: 1,
  csrf_token_presence: 1,
  unusual_headers: 0,
  client_error_rate: 2,
  failed_login_attempts: 0,
  unusual_sql_queries: 0,
  response_time: 200,
  server_error_rate: 0,
  request_rate: 25,
  unusual_http_methods: 0,
  ip_reputation_score: 95,
  brute_force_signatures: 0,
  suspicious_file_uploads: 0
});

const collectorOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/collect/frontend',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': collectorData.length
  }
};

const collectorReq = http.request(collectorOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Collector API Frontend Response:', data);
  });
}).on('error', (err) => {
  console.error('Collector API Frontend Error:', err.message);
});

collectorReq.write(collectorData);
collectorReq.end();