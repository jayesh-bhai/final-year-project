from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
import sys
import os

# Add the current directory to the path so we can import our model
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model import AnomalyDetectionModel

# Initialize FastAPI app
app = FastAPI(title="SentinelWeb ML Anomaly Detection API", version="1.0.0")

# Global model instance
model = None

class PredictionRequest(BaseModel):
    features: list  # List of numerical features for anomaly detection

class PredictionResponse(BaseModel):
    score: float    # Anomaly score between 0 and 1
    is_anomaly: bool # Whether the input is considered anomalous
    confidence: float # Confidence in the prediction

@app.on_event('startup')
def startup_event():
    """Initialize the model when the server starts"""
    global model
    print("Loading Isolation Forest model...")
    
    try:
        model = AnomalyDetectionModel()
        
        # Check if a trained model exists, if not train a new one
        model_path = os.path.join(os.path.dirname(__file__), 'isolation_forest_model.pkl')
        
        if os.path.exists(model_path):
            print("Loading existing trained model...")
            model.load_model(model_path)
        else:
            print("No existing model found. Training new model...")
            model.train()
            model.save_model(model_path)
        
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error initializing model: {str(e)}")
        raise

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ML Anomaly Detection API"}

@app.post("/predict", response_model=PredictionResponse)
def predict_anomaly(request: PredictionRequest):
    """Predict anomaly score for given features"""
    global model
    
    if model is None or not model.is_trained:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    try:
        # Validate input
        if not request.features or len(request.features) == 0:
            return PredictionResponse(score=0.5, is_anomaly=False, confidence=0.5)
        
        # Ensure all features are numeric
        features = [float(x) for x in request.features]
        
        # Get anomaly score
        score = model.predict_anomaly_score(features)
        
        # Determine if it's an anomaly (threshold can be adjusted)
        is_anomaly = score > 0.7  # Threshold for considering something anomalous
        
        # Calculate confidence based on distance from threshold
        confidence = min(1.0, abs(score - 0.5) * 2)  # Closer to 0 or 1 means higher confidence
        
        return PredictionResponse(
            score=score,
            is_anomaly=is_anomaly,
            confidence=confidence
        )
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
def health_check():
    """Detailed health check"""
    global model
    return {
        "status": "healthy",
        "model_loaded": model is not None and model.is_trained,
        "service": "ML Anomaly Detection API"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )