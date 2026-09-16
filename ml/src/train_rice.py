import os
import sys
import json
import yaml

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras import layers, models, applications

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

def load_config(config_path):
    with open(config_path, 'r') as file:
        return yaml.safe_load(file)

def main():
    config = load_config(os.path.join(REPO_ROOT, "ml/config_rice.yaml"))
    
    input_size = tuple(config["training"]["input_size"])
    batch_size = config["training"]["batch_size"]
    epochs = config["training"]["epochs"]
    lr = config["training"]["learning_rate"]
    
    train_dir = os.path.join(REPO_ROOT, config["paths"]["train_dir"])
    val_dir = os.path.join(REPO_ROOT, config["paths"]["val_dir"])
    models_dir = os.path.join(REPO_ROOT, config["paths"]["models_dir"])
    os.makedirs(models_dir, exist_ok=True)
    
    print("Loading datasets...")
    train_ds = image_dataset_from_directory(
        train_dir,
        image_size=input_size,
        batch_size=batch_size,
        label_mode='categorical'
    )
    
    val_ds = image_dataset_from_directory(
        val_dir,
        image_size=input_size,
        batch_size=batch_size,
        label_mode='categorical'
    )
    
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes: {class_names}")

    # Build model using MobileNetV2
    print("Building model...")
    # Using preprocessing for [-1, 1] scaling
    inputs = tf.keras.Input(shape=(input_size[0], input_size[1], 3))
    x = layers.Rescaling(1./127.5, offset=-1)(inputs)
    
    base_model = applications.MobileNetV2(
        input_shape=(input_size[0], input_size[1], 3),
        include_top=False,
        weights='imagenet'
    )
    base_model.trainable = False  # Freeze base model
    
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=lr),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("Starting training...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs
    )
    
    model_path = os.path.join(models_dir, "RICE_ML_model.keras")
    model.save(model_path)
    print(f"Model saved to {model_path}")
    
    class_names_path = os.path.join(models_dir, "class_names.json")
    with open(class_names_path, 'w') as f:
        json.dump(class_names, f)
        
    metadata = {
        "model_name": "RICE_ML_model",
        "crop": "rice",
        "framework": "keras",
        "input_size": list(input_size),
        "num_classes": num_classes,
        "classes": class_names,
        "status": "production"
    }
    with open(os.path.join(models_dir, "model_metadata.json"), 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Training pipeline complete.")

if __name__ == "__main__":
    main()
