const http = require('http');

// Test Collector API health endpoint
console.log('Testing Collector API health endpoint...');
const collectorHealthReq = http.get('http://localhost:5000/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Collector API Health Response:', data);
  });
}).on('error', (err) => {
  console.error('Collector API Health Error:', err.message);
});

// Test ML Service predict endpoint
console.log('Testing ML Service predict endpoint...');
const mlData = JSON.stringify({
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

const mlOptions = {
  hostname: 'localhost',
  port: 6000,
  path: '/predict',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': mlData.length
  }
};

const mlReq = http.request(mlOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('ML Service Predict Response:', data);
  });
}).on('error', (err) => {
  console.error('ML Service Predict Error:', err.message);
});

mlReq.write(mlData);
mlReq.end();