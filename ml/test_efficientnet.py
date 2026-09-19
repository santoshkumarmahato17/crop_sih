"""
Test both preprocessing modes to find which gives correct predictions for the EfficientNetB0 model.
"""
import sys, os
sys.path.insert(0, 'C:\\tf_install')
sys.path.insert(0, 'c:\\Users\\krsan\\Desktop\\crop')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import numpy as np
from PIL import Image
import io
import json
import glob

try:
    import tensorflow as tf
except ImportError:  # pragma: no cover
    tf = None

import os

base_dir = os.path.abspath(os.path.dirname(__file__))
model_path = os.path.join(base_dir, 'models_efficientnet', 'crop_disease_efficientnetb0.keras')
classes_path = os.path.join(base_dir, 'models_efficientnet', 'class_names.json')

# Load class names
with open(classes_path) as f:
    classes = json.load(f)

# Load model if TensorFlow is available; otherwise use dummy.
if tf:
    model = tf.keras.models.load_model(model_path, compile=False)
else:
    class DummyModel:
        def predict(self, _tensor, verbose=0):
            import numpy as np
            return np.zeros((1, len(classes)))
    model = DummyModel()

def run_test(img_path, preprocess_mode):
    image = Image.open(img_path).convert('RGB').resize((224, 224), Image.BILINEAR)
    arr = np.array(image, dtype=np.float32)
    
    if preprocess_mode == 'normalize_01':
        arr = arr / 255.0
    elif preprocess_mode == 'normalize_m1_1':
        arr = (arr / 127.5) - 1.0
    elif preprocess_mode == 'raw':
        pass  # keep as 0-255
    
    tensor = np.expand_dims(arr, axis=0)
    preds = model.predict(tensor, verbose=0)[0]
    top_idx = np.argsort(preds)[::-1][:5]
    return [(classes[i], round(float(preds[i]) * 100, 2)) for i in top_idx]

# Test on healthy tomato image
tomato_images = glob.glob('c:/Users/krsan/Desktop/crop/Tomato/healthy/*.jpg')
if not tomato_images:
    tomato_images = glob.glob('c:/Users/krsan/Desktop/crop/Tomato/**/*.jpg', recursive=True)

test_img = tomato_images[0] if tomato_images else None
if not test_img:
    print("No tomato image found!")
    sys.exit(1)

print(f"\nTest image: {test_img}")
print("\n--- Mode 1: Raw [0-255] ---")
for cls, conf in run_test(test_img, 'raw'):
    print(f"  {cls}: {conf}%")

print("\n--- Mode 2: Normalized [0-1] ---")
for cls, conf in run_test(test_img, 'normalize_01'):
    print(f"  {cls}: {conf}%")

print("\n--- Mode 3: Normalized [-1, 1] ---")
for cls, conf in run_test(test_img, 'normalize_m1_1'):
    print(f"  {cls}: {conf}%")
