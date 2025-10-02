// Test script to verify the system is working
async function testSystem() {
  // Test data for a normal user session
  const normalData = {
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
    response_time: 400,
    server_error_rate: 1,
    request_rate: 30,
    unusual_http_methods: 0,
    ip_reputation_score: 85,
    brute_force_signatures: 0,
    suspicious_file_uploads: 0
  };

  console.log('Testing normal user session...');
  try {
    const response = await fetch('http://localhost:5000/api/collect/frontend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalData)
    });
    
    const result = await response.json();
    console.log('Normal session result:', result);
  } catch (error) {
    console.error('Error testing normal session:', error.message);
  }
}

testSystem();