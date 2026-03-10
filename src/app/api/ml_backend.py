"""
FraudGuard ML Backend - Optimized Flask Application
Features:
- Model loaded once at startup (not per request)
- Batch processing (250-500 rows)
- Comprehensive logging
- Optimized for larger datasets
"""

import os
import logging
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for model and feature columns (loaded once at startup)
MODEL = None
FEATURE_COLUMNS = None
MODEL_LOADED = False

# Batch size for processing
BATCH_SIZE = 250


def load_model():
    """
    Load the ML model once at startup.
    This is called when the app starts, not on every request.
    """
    global MODEL, FEATURE_COLUMNS, MODEL_LOADED
    
    if MODEL_LOADED:
        logger.info("Model already loaded, skipping...")
        return
    
    try:
        logger.info("Loading ML model...")
        start_time = time.time()
        
        # Import sklearn components
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        
        # Create a mock model for demonstration
        # In production, load from file: joblib.load('model.pkl')
        MODEL = {
            'classifier': RandomForestClassifier(n_estimators=100, random_state=42),
            'scaler': StandardScaler()
        }
        
        # Define feature columns expected by the model
        FEATURE_COLUMNS = [
            'step', 'amount', 'oldbalanceOrg', 'newbalanceOrig',
            'oldbalanceDest', 'newbalanceDest'
        ]
        
        # Train on dummy data for demonstration
        # In production, this would load pre-trained model
        X_train = np.random.randn(10000, len(FEATURE_COLUMNS))
        y_train = (np.random.random(10000) > 0.9).astype(int)
        MODEL['scaler'].fit(X_train)
        X_scaled = MODEL['scaler'].transform(X_train)
        MODEL['classifier'].fit(X_scaled, y_train)
        
        MODEL_LOADED = True
        load_time = time.time() - start_time
        logger.info(f"ML model loaded successfully in {load_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        MODEL = None
        FEATURE_COLUMNS = None
        MODEL_LOADED = False


def preprocess_transaction(tx_data):
    """
    Preprocess a single transaction for prediction.
    Uses vectorized pandas operations where possible.
    """
    try:
        # Extract features
        features = []
        for col in FEATURE_COLUMNS:
            val = tx_data.get(col, 0)
            try:
                features.append(float(val) if val is not None else 0)
            except (ValueError, TypeError):
                features.append(0)
        
        return np.array(features).reshape(1, -1)
    except Exception as e:
        logger.error(f"Error preprocessing transaction: {e}")
        return None


def preprocess_batch(transactions_df):
    """
    Preprocess a batch of transactions using vectorized operations.
    More efficient than row-by-row processing.
    """
    try:
        # Extract features as numpy array
        features = transactions_df[FEATURE_COLUMNS].fillna(0).values
        
        # Scale using the fitted scaler
        features_scaled = MODEL['scaler'].transform(features)
        
        return features_scaled
    except Exception as e:
        logger.error(f"Error preprocessing batch: {e}")
        return None


def predict_batch(features_scaled):
    """
    Make predictions on a batch of transactions.
    Uses vectorized operations for efficiency.
    """
    try:
        # Get prediction probabilities
        probabilities = MODEL['classifier'].predict_proba(features_scaled)[:, 1]
        
        # Get class predictions
        predictions = (probabilities > 0.5).astype(int)
        
        return predictions, probabilities
    except Exception as e:
        logger.error(f"Error making batch predictions: {e}")
        return None, None


@app.route('/', methods=['GET'])
def index():
    """Health check endpoint - returns basic info."""
    return jsonify({
        'status': 'ok',
        'service': 'FraudGuard ML API',
        'version': '2.0.0',
        'model_loaded': MODEL_LOADED
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy' if MODEL_LOADED else 'model_not_loaded',
        'model_loaded': MODEL_LOADED,
        'batch_size': BATCH_SIZE
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Main prediction endpoint.
    Accepts JSON with 'transactions' array.
    Processes in batches for better performance.
    """
    request_start = time.time()
    
    # Log request received
    logger.info("=" * 60)
    logger.info("REQUEST RECEIVED: /predict")
    logger.info("=" * 60)
    
    try:
        # Parse request
        data = request.get_json()
        
        if not data or 'transactions' not in data:
            logger.warning("Invalid request: missing 'transactions' field")
            return jsonify({'error': 'Missing transactions array'}), 400
        
        transactions = data['transactions']
        total_count = len(transactions)
        
        logger.info(f"CSV parsing time: {time.time() - request_start:.2f}s")
        logger.info(f"Processing {total_count} transactions in batches of {BATCH_SIZE}")
        
        if not MODEL_LOADED:
            logger.error("Model not loaded!")
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Convert to DataFrame for efficient batch processing
        preprocess_start = time.time()
        
        try:
            df = pd.DataFrame(transactions)
            logger.info(f"DataFrame created with {len(df)} rows")
            
            # Handle missing columns
            for col in FEATURE_COLUMNS:
                if col not in df.columns:
                    df[col] = 0
            
            logger.info(f"Preprocessing time: {time.time() - preprocess_start:.2f}s")
            
        except Exception as e:
            logger.error(f"Error creating DataFrame: {e}")
            return jsonify({'error': f'Failed to process transactions: {str(e)}'}), 400
        
        # Process in batches
        prediction_start = time.time()
        all_predictions = []
        all_probabilities = []
        
        num_batches = (len(df) + BATCH_SIZE - 1) // BATCH_SIZE
        logger.info(f"Processing in {num_batches} batches...")
        
        for i in range(0, len(df), BATCH_SIZE):
            batch_df = df.iloc[i:i+BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            
            logger.info(f"Processing batch {batch_num}/{num_batches} ({len(batch_df)} rows)")
            
            # Preprocess batch
            features_scaled = preprocess_batch(batch_df)
            
            if features_scaled is not None:
                # Get predictions
                preds, probs = predict_batch(features_scaled)
                
                if preds is not None:
                    all_predictions.extend(preds.tolist())
                    all_probabilities.extend(probs.tolist())
        
        logger.info(f"Prediction time: {time.time() - prediction_start:.2f}s")
        
        # Build results - only return necessary fields
        results = []
        for i, tx in enumerate(transactions):
            tx_result = {
                'transaction_id': tx.get('transaction_id', tx.get('nameOrig', f'TXN_{i+1}')),
                'prediction': float(all_probabilities[i]) if i < len(all_probabilities) else 0,
                'is_fraud': bool(all_predictions[i]) if i < len(all_predictions) else False,
            }
            results.append(tx_result)
        
        total_time = time.time() - request_start
        logger.info(f"TOTAL RESPONSE TIME: {total_time:.2f}s")
        logger.info(f"Fraud detected: {sum(all_predictions)}/{len(all_predictions)}")
        
        return jsonify({
            'predictions': results,
            'summary': {
                'total_transactions': len(results),
                'fraud_detected': sum(all_predictions),
                'fraud_rate': float(sum(all_predictions) / len(results) * 100) if results else 0,
                'processing_time_seconds': round(total_time, 2)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in /predict: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/process-dataset', methods=['POST'])
def process_dataset():
    """
    Alternative endpoint for processing CSV content directly.
    This is kept for backward compatibility but uses the same optimized logic.
    """
    request_start = time.time()
    
    logger.info("REQUEST RECEIVED: /process-dataset")
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        csv_content = data.get('csv_content', '')
        file_name = data.get('file_name', 'data.csv')
        
        if not csv_content:
            return jsonify({'error': 'No csv_content provided'}), 400
        
        parse_start = time.time()
        
        # Parse CSV
        from io import StringIO
        df = pd.read_csv(StringIO(csv_content))
        
        logger.info(f"CSV parsing time: {time.time() - parse_start:.2f}s")
        logger.info(f"Processing {len(df)} rows")
        
        # Convert to transactions list
        transactions = df.to_dict('records')
        
        # Use /predict logic
        request.json = {'transactions': transactions}
        
        return predict()
        
    except Exception as e:
        logger.error(f"Error in /process-dataset: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# Load model when app starts
if __name__ == '__main__':
    load_model()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
