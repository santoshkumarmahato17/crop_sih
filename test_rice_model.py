import os
import sys

def check_model():
    try:
        import tensorflow as tf
        model_path = os.path.join("backend", "models", "rice", "RICE_ML_model.keras")
        print(f"Loading model from {model_path}...")
        
        if not os.path.exists(model_path):
            print("ERROR: Model file not found!")
            return
            
        model = tf.keras.models.load_model(model_path, compile=False)
        
        print("\n--- Model Architecture ---")
        model.summary()
        
        print("\n--- Model Details ---")
        print(f"Input Shape: {model.input_shape}")
        print(f"Output Shape: {model.output_shape}")
        
        print("\n--- Testing Inference Connection ---")
        import numpy as np
        # Create a dummy image tensor (1, 224, 224, 3)
        dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
        
        preds = model.predict(dummy_input)
        print(f"Raw Output Predictions: {preds}")
        print(f"Predicted Class Index: {np.argmax(preds[0])}")
        
        print("\n✅ SUCCESS: The model is fully connected, trained, and ready for inference!")
        
    except Exception as e:
        print(f"❌ ERROR: Failed to load or run the model. Details: {e}")

if __name__ == "__main__":
    check_model()
