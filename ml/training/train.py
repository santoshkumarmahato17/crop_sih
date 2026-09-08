import os
import json
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split, WeightedRandomSampler
from torchvision import datasets, transforms, models
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import sys

# Add ml folder to path to import class_mapping
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from inference.class_mapping import CLASS_MAPPING, save_mapping

DATASET_DIR = r"C:\Users\ELCOT\OneDrive - ELCOT\Desktop\SIH_26\orange d-set"
MODELS_DIR = r"C:\Users\ELCOT\OneDrive - ELCOT\Desktop\SIH_26\ml\models"
REPORTS_DIR = r"C:\Users\ELCOT\OneDrive - ELCOT\Desktop\SIH_26\ml\reports"

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

BATCH_SIZE = 32
NUM_EPOCHS = 3 # Kept low for execution speed, adjust for production
LEARNING_RATE = 0.001
IMAGE_SIZE = 224

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_test_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_test_transform

def prepare_data():
    full_dataset = datasets.ImageFolder(root=DATASET_DIR)
    
    # Save class mapping to models folder
    save_mapping(os.path.join(MODELS_DIR, "class_names.json"))
    
    total_size = len(full_dataset)
    
    # Limit dataset size for reasonable execution time (e.g. max 500 per class -> total 2500)
    # To keep it authentic but fast, we use a Subset of 10% of the data or less.
    subset_size = min(total_size, 1000)
    indices = torch.randperm(total_size)[:subset_size].tolist()
    subset_dataset = torch.utils.data.Subset(full_dataset, indices)
    
    train_size = int(0.8 * subset_size)
    val_size = int(0.1 * subset_size)
    test_size = subset_size - train_size - val_size
    
    train_ds, val_ds, test_ds = random_split(subset_dataset, [train_size, val_size, test_size], generator=torch.Generator().manual_seed(42))
    
    train_transform, val_test_transform = get_transforms()
    train_ds.dataset.dataset.transform = train_transform
    val_ds.dataset.dataset.transform = val_test_transform
    test_ds.dataset.dataset.transform = val_test_transform
    
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    return train_loader, val_loader, test_loader, full_dataset.classes

def build_model(num_classes):
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    
    # Freeze backbone
    for param in model.parameters():
        param.requires_grad = False
        
    # Unfreeze last layers
    for param in model.features[-2:].parameters():
        param.requires_grad = True
        
    # Modify classification head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    
    return model.to(device)

def train_model():
    print(f"Using device: {device}")
    train_loader, val_loader, test_loader, class_folders = prepare_data()
    num_classes = len(class_folders)
    
    model = build_model(num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.classifier.parameters(), lr=LEARNING_RATE)
    
    best_val_acc = 0.0
    history = {"train_loss": [], "val_loss": [], "train_acc": [], "val_acc": []}
    
    for epoch in range(NUM_EPOCHS):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        epoch_loss = running_loss / total
        epoch_acc = correct / total
        history["train_loss"].append(epoch_loss)
        history["train_acc"].append(epoch_acc)
        
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * inputs.size(0)
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
                
        val_epoch_loss = val_loss / val_total
        val_epoch_acc = val_correct / val_total
        history["val_loss"].append(val_epoch_loss)
        history["val_acc"].append(val_epoch_acc)
        
        print(f"Epoch {epoch+1}/{NUM_EPOCHS} - Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc:.4f} - Val Loss: {val_epoch_loss:.4f}, Val Acc: {val_epoch_acc:.4f}")
        
        if val_epoch_acc > best_val_acc:
            best_val_acc = val_epoch_acc
            torch.save(model.state_dict(), os.path.join(MODELS_DIR, "best_model.pth"))
            
    torch.save(model.state_dict(), os.path.join(MODELS_DIR, "last_model.pth"))
    
    # Plot history
    plt.figure(figsize=(10, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history['train_acc'], label='Train Accuracy')
    plt.plot(history['val_acc'], label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.legend()
    plt.subplot(1, 2, 2)
    plt.plot(history['train_loss'], label='Train Loss')
    plt.plot(history['val_loss'], label='Validation Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    plt.savefig(os.path.join(REPORTS_DIR, "training_history.png"))
    
    evaluate_model(model, test_loader, class_folders)
    export_models(model)

def evaluate_model(model, test_loader, class_folders):
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, predicted = torch.max(outputs.data, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    acc = accuracy_score(all_labels, all_preds)
    prec = precision_score(all_labels, all_preds, average=None)
    rec = recall_score(all_labels, all_preds, average=None)
    f1 = f1_score(all_labels, all_preds, average=None)
    
    report = {
        "test_accuracy": acc,
        "per_class": {}
    }
    
    for i, folder in enumerate(class_folders):
        display_name = CLASS_MAPPING.get(folder, {}).get("display_name", folder)
        report["per_class"][display_name] = {
            "precision": prec[i],
            "recall": rec[i],
            "f1_score": f1[i]
        }
        
    with open(os.path.join(REPORTS_DIR, "classification_report.json"), "w") as f:
        json.dump(report, f, indent=4)
        
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(8, 6))
    display_names = [CLASS_MAPPING.get(f, {}).get("display_name", f) for f in class_folders]
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=display_names, yticklabels=display_names)
    plt.ylabel('Actual')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, "confusion_matrix.png"))
    
def export_models(model):
    model.eval()
    dummy_input = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE).to(device)
    
    # Export ONNX
    onnx_path = os.path.join(MODELS_DIR, "model.onnx")
    try:
        torch.onnx.export(model, dummy_input, onnx_path, 
                          export_params=True, opset_version=11, 
                          do_constant_folding=True, 
                          input_names=['input'], output_names=['output'],
                          dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}})
        print("ONNX model exported successfully.")
    except Exception as e:
        print(f"Failed to export ONNX: {e}")

if __name__ == "__main__":
    train_model()
