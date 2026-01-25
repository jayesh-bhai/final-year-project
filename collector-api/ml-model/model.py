import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import json
from datetime import datetime
import os

class AnomalyDetectionModel:
    def __init__(self):
        self.model = IsolationForest(
            contamination=0.1,  # Expected proportion of outliers
            random_state=42,
            n_estimators=100
        )
        self.is_trained = False
        
    def generate_training_data(self):
        """
        Generate synthetic normal behavior data for training
        Features: [mouse_clicks, keystrokes, scrolls, form_interactions, nav_events, idle_time,
                  total_requests, response_time_avg, error_rate, rate_limit_hits,
                  login_attempts, failed_logins, successful_logins, time_of_day]
        """
        print("Generating synthetic training data...")
        
        # Normal behavior patterns
        normal_samples = []
        
        # Generate 1000 samples of normal user behavior
        for _ in range(1000):
            sample = [
                np.random.normal(50, 30),      # mouse_clicks (mean=50, std=30)
                np.random.normal(100, 50),     # keystrokes (mean=100, std=50)
                np.random.normal(20, 15),      # scrolls (mean=20, std=15)
                np.random.normal(5, 3),        # form_interactions (mean=5, std=3)
                np.random.normal(15, 10),      # nav_events (mean=15, std=10)
                np.random.normal(300000, 120000), # idle_time in ms (mean=5min, std=2min)
                np.random.normal(50, 25),      # total_requests (mean=50, std=25)
                np.random.normal(200, 100),    # response_time_avg in ms (mean=200ms, std=100ms)
                np.random.uniform(0.0, 0.05),  # error_rate (0-5%)
                np.random.poisson(0.5),        # rate_limit_hits (avg 0.5 per session)
                np.random.poisson(2),          # login_attempts (avg 2 per session)
                np.random.poisson(0.2),        # failed_logins (avg 0.2 per session)
                np.random.poisson(1.8),        # successful_logins (avg 1.8 per session)
                np.random.uniform(0, 86400000) # time_of_day in milliseconds
            ]
            
            # Ensure non-negative values for counts
            sample = [max(0, val) for val in sample]
            normal_samples.append(sample)
        
        return np.array(normal_samples)
    
    def train(self):
        """Train the Isolation Forest model on synthetic data"""
        print("Training Isolation Forest model...")
        
        # Generate training data
        X_train = self.generate_training_data()
        
        # Train the model
        self.model.fit(X_train)
        self.is_trained = True
        
        print(f"Model trained on {len(X_train)} samples")
        print("Training completed successfully!")
        
    def predict_anomaly_score(self, features):
        """
        Predict anomaly score for given features
        Returns a score between 0 and 1, where higher values indicate anomalies
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        # Ensure features is a 2D array
        if len(features) == 0:
            return 0.5  # Return neutral score for empty features
        
        if isinstance(features, list):
            features = np.array(features).reshape(1, -1)
        elif len(features.shape) == 1:
            features = features.reshape(1, -1)
        
        # Use decision_function to get anomaly scores
        # negative_outlier_factor_ is negative, so we negate it to get positive scores
        anomaly_scores = -self.model.decision_function(features)
        
        # Normalize scores to 0-1 range using sigmoid-like transformation
        # Higher anomaly scores from isolation forest indicate more anomalous behavior
        normalized_scores = 1 / (1 + np.exp(-anomaly_scores))
        
        # Return the average score (since we usually pass single sample)
        return float(np.mean(normalized_scores))
    
    def save_model(self, filepath):
        """Save the trained model to a file"""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        with open(filepath, 'wb') as f:
            pickle.dump(self.model, f)
        
        print(f"Model saved to {filepath}")
        
    def load_model(self, filepath):
        """Load a trained model from a file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file {filepath} does not exist")
        
        with open(filepath, 'rb') as f:
            self.model = pickle.load(f)
        
        self.is_trained = True
        print(f"Model loaded from {filepath}")

def main():
    """Main function to train and save the model"""
    print("Initializing Anomaly Detection Model...")
    
    # Create and train model
    model = AnomalyDetectionModel()
    model.train()
    
    # Save the trained model
    model_path = os.path.join(os.path.dirname(__file__), 'isolation_forest_model.pkl')
    model.save_model(model_path)
    
    # Test the model with some examples
    print("\nTesting model with sample data...")
    
    # Normal behavior sample
    normal_sample = [50, 100, 20, 5, 15, 300000, 50, 200, 0.02, 0, 2, 0, 2, 43200000]
    normal_score = model.predict_anomaly_score(normal_sample)
    print(f"Normal behavior score: {normal_score:.3f}")
    
    # Anomalous behavior sample (too many clicks, high error rate, etc.)
    anomalous_sample = [200, 500, 80, 30, 100, 10000, 200, 1000, 0.2, 10, 15, 10, 5, 43200000]
    anomalous_score = model.predict_anomaly_score(anomalous_sample)
    print(f"Anomalous behavior score: {anomalous_score:.3f}")
    
    print("\nModel training and testing completed!")

if __name__ == "__main__":
    main()