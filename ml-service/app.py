from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("dummy_attack_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    feature_order = [
        "session_duration", "page_navigation_rate", "input_field_activity",
        "mouse_click_frequency", "suspicious_input_patterns", "form_submission_rate",
        "csrf_token_presence", "unusual_headers", "client_error_rate",
        "failed_login_attempts", "unusual_sql_queries", "response_time",
        "server_error_rate", "request_rate", "unusual_http_methods",
        "ip_reputation_score", "brute_force_signatures", "suspicious_file_uploads"
    ]
    features = np.array([data.get(f, 0) for f in feature_order]).reshape(1, -1)
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1]
    return jsonify({
        "is_attack": int(prediction),
        "probability": float(probability)
    })

if __name__ == "__main__":
    app.run(port=6000, debug=True)