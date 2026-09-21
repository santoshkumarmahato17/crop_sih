import json
import sys

config_path = r"D:\work\New folder\ORANGE_ML_model.keras\config.json"

try:
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
        
        cfg = config.get('config', {})
        layers = cfg.get('layers', [])
        
        # 1. Input Shape & Dimensions
        input_layer = next((l for l in layers if l.get('class_name') == 'InputLayer'), None)
        if input_layer:
            print(f"Input config: {input_layer['config']}")
            
        # 2. Rescaling / Preprocessing
        rescaling = next((l for l in layers if 'rescaling' in l.get('class_name', '').lower() or 'rescaling' in l.get('name', '').lower()), None)
        if rescaling:
            print(f"Preprocessing Rescaling Layer: {rescaling['class_name']} -> {rescaling['config']}")
        else:
            print("No internal Rescaling layer found.")
            
        # 3. Output Classes & Activation
        output_layer = layers[-1]
        print(f"Output layer config: {output_layer.get('config')}")
        
        # 4. Architecture info
        print(f"Model Architecture Base: {config.get('class_name')}")
        print(f"Total layers: {len(layers)}")
        
except Exception as e:
    print(f"Error reading config: {e}")
