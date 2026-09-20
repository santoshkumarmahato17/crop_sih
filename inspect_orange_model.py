import tensorflow as tf
import json

model_path = r"D:\work\New folder\ORANGE_ML_model.keras"
model = tf.keras.models.load_model(model_path)

print(f"Model: {model_path}")

input_shape = model.input_shape
print(f"Input shape: {input_shape}")
print(f"Input image dimensions: {input_shape[1:3]}")

output_shape = model.output_shape
print(f"Output shape: {output_shape}")

num_classes = output_shape[-1]
print(f"Number of output classes: {num_classes}")

output_layer = model.layers[-1]
try:
    activation = output_layer.activation.__name__
except AttributeError:
    activation = "unknown"
print(f"Output layer activation: {activation}")

if num_classes == 1 or activation == 'sigmoid':
    print("Model type: Binary")
else:
    print("Model type: Multiclass")

print("Architecture:")
model.summary(print_fn=lambda x: print(x))

print("Expected preprocessing/Normalization requirements: Look for Rescaling layer")
has_rescaling = any('rescaling' in layer.name.lower() for layer in model.layers)
print(f"Contains built-in rescaling layer: {has_rescaling}")
if has_rescaling:
    for layer in model.layers:
        if 'rescaling' in layer.name.lower():
            print(f"Rescaling layer found: scale={layer.scale}, offset={layer.offset}")

# Check class names
if hasattr(model, 'class_names'):
    print(f"Class names (attribute): {model.class_names}")
else:
    print("Class names not found as attribute. Will need to infer or check metadata.")
    
    # Try looking in a metadata json or similar nearby, or maybe check orange_dataset_folds.csv
    pass

# Inference test
import numpy as np
try:
    test_input = np.random.rand(1, *input_shape[1:]).astype(np.float32)
    pred = model.predict(test_input, verbose=0)
    print(f"Inference test: PASS (output: {pred})")
except Exception as e:
    print(f"Inference test: FAIL ({e})")
