import requests
import json

def test_system():
    # Test normal data
    normal_data = {
        "session_duration": 300,
        "page_navigation_rate": 3,
        "input_field_activity": 20,
        "mouse_click_frequency": 30,
        "suspicious_input_patterns": 0,
        "form_submission_rate": 1,
        "csrf_token_presence": 1,
        "unusual_headers": 0,
        "client_error_rate": 2,
        "failed_login_attempts": 0,
        "unusual_sql_queries": 0,
        "response_time": 500,
        "server_error_rate": 0,
        "request_rate": 25,
        "unusual_http_methods": 0,
        "ip_reputation_score": 85,
        "brute_force_signatures": 0,
        "suspicious_file_uploads": 0
    }

    # Test attack data
    attack_data = {
        "session_duration": 10,
        "page_navigation_rate": 8,
        "input_field_activity": 2,
        "mouse_click_frequency": 5,
        "suspicious_input_patterns": 1,
        "form_submission_rate": 8,
        "csrf_token_presence": 0,
        "unusual_headers": 1,
        "client_error_rate": 12,
        "failed_login_attempts": 5,
        "unusual_sql_queries": 1,
        "response_time": 2500,
        "server_error_rate": 8,
        "request_rate": 300,
        "unusual_http_methods": 1,
        "ip_reputation_score": 20,
        "brute_force_signatures": 1,
        "suspicious_file_uploads": 1
    }

    try:
        print("Testing normal data...")
        response = requests.post(
            'http://localhost:5000/api/collect/frontend',
            headers={'Content-Type': 'application/json'},
            data=json.dumps(normal_data)
        )
        
        result = response.json()
        print("Response:", result)
        
        if result.get('analysis', {}).get('is_attack') == 0:
            print("✅ Normal data correctly identified")
        else:
            print("❌ Normal data incorrectly flagged as attack")
            
        print("\nTesting attack data...")
        response = requests.post(
            'http://localhost:5000/api/collect/frontend',
            headers={'Content-Type': 'application/json'},
            data=json.dumps(attack_data)
        )
        
        result = response.json()
        print("Response:", result)
        
        if result.get('analysis', {}).get('is_attack') == 1:
            print("✅ Attack data correctly identified")
        else:
            print("❌ Attack data incorrectly flagged as normal")
            
    except Exception as e:
        print(f"Error testing system: {e}")

if __name__ == "__main__":
    test_system()