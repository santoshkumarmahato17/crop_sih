import zipfile
import json
import os
import sys

model_path = r"c:\Users\krsan\Desktop\crop\ORANGE_ML_model.keras"

if not os.path.exists(model_path):
    print(f"Error: Could not find model at {model_path}")
    sys.exit(1)

try:
    with zipfile.ZipFile(model_path, 'r') as archive:
        print("Archive contents:")
        for name in archive.namelist():
            print(f" - {name}")
            
        print("\n--- Metadata ---")
        if 'metadata.json' in archive.namelist():
            metadata = json.loads(archive.read('metadata.json'))
            print(json.dumps(metadata, indent=2))
            
        print("\n--- Config ---")
        if 'config.json' in archive.namelist():
            config = json.loads(archive.read('config.json'))
            
            # Print high-level config summary instead of dumping massive json
            print(f"Model Class: {config.get('class_name')}")
            
            # Find input shape and output classes
            cfg = config.get('config', {})
            layers = cfg.get('layers', [])
            
            if layers:
                # Find input shape
                for layer in layers:
                    if layer.get('class_name') == 'InputLayer':
                        print(f"Input shape: {layer.get('config', {}).get('batch_input_shape')}")
                        break
                        
                # Check for rescaling
                for layer in layers:
                    if 'rescaling' in layer.get('class_name', '').lower() or 'rescaling' in layer.get('name', '').lower():
                        print(f"Found Rescaling layer: {layer.get('class_name')} - config: {layer.get('config')}")
                        
                # Find output classes
                output_layer = layers[-1]
                print(f"Output layer: {output_layer.get('class_name')}")
                out_cfg = output_layer.get('config', {})
                units = out_cfg.get('units')
                activation = out_cfg.get('activation')
                print(f"Output units (classes): {units}")
                print(f"Output activation: {activation}")
                
            else:
                print("No layers found in config.")
                print(json.dumps(config, indent=2)[:500]) # Print first 500 chars if unexpected structure
except Exception as e:
    print(f"Error reading keras archive: {e}")
