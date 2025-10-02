# synthetic_data_gen.py
import pandas as pd
import numpy as np

def generate_synthetic_data(n_samples=5000):
    data = []

    for _ in range(n_samples):
        # Randomly decide if this is an attack or normal
        is_attack = np.random.choice([0, 1], p=[0.7, 0.3])  # 70% normal, 30% attack

        if is_attack == 0:
            # Normal user behavior (low suspicious values)
            row = {
                "session_duration": np.random.randint(30, 600),
                "page_navigation_rate": np.random.randint(1, 6),
                "input_field_activity": np.random.randint(5, 40),
                "mouse_click_frequency": np.random.randint(5, 50),
                "suspicious_input_patterns": 0,
                "form_submission_rate": np.random.randint(0, 3),
                "csrf_token_presence": 1,
                "unusual_headers": 0,
                "client_error_rate": np.random.randint(0, 5),
                "failed_login_attempts": np.random.randint(0, 2),
                "unusual_sql_queries": 0,
                "response_time": np.random.randint(100, 800),
                "server_error_rate": np.random.randint(0, 2),
                "request_rate": np.random.randint(10, 50),
                "unusual_http_methods": 0,
                "ip_reputation_score": np.random.randint(70, 100),
                "brute_force_signatures": 0,
                "suspicious_file_uploads": 0,
                "is_attack": 0
            }
        else:
            # Attack behavior (high suspicious values)
            row = {
                "session_duration": np.random.randint(1, 50),
                "page_navigation_rate": np.random.randint(5, 15),
                "input_field_activity": np.random.randint(0, 5),
                "mouse_click_frequency": np.random.randint(0, 10),
                "suspicious_input_patterns": 1,
                "form_submission_rate": np.random.randint(3, 10),
                "csrf_token_presence": 0,
                "unusual_headers": 1,
                "client_error_rate": np.random.randint(5, 15),
                "failed_login_attempts": np.random.randint(3, 10),
                "unusual_sql_queries": 1,
                "response_time": np.random.randint(800, 3000),
                "server_error_rate": np.random.randint(5, 15),
                "request_rate": np.random.randint(100, 500),
                "unusual_http_methods": 1,
                "ip_reputation_score": np.random.randint(0, 50),
                "brute_force_signatures": 1,
                "suspicious_file_uploads": 1,
                "is_attack": 1
            }
        data.append(row)

    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_synthetic_data(5000)
    df.to_csv("synthetic_dataset.csv", index=False)
    print("✅ Synthetic dataset generated: synthetic_dataset.csv")
    print(df.head())
