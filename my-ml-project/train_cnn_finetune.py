import os
import sys
import argparse
import pandas as pd
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import joblib

class CropImageDataset(Dataset):
    def __init__(self, filepaths, labels, transform=None):
        self.filepaths = filepaths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.filepaths)

    def __getitem__(self, idx):
        path = self.filepaths[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, self.labels[idx]

def get_transforms():
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform

def train_model(epochs=5, csv_path='soybean_dataset_folds.csv'):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    print(f"Loading dataset splits from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    le = LabelEncoder()
    df['label_idx'] = le.fit_transform(df['target_class'])
    num_classes = len(le.classes_)
    
    prefix = csv_path.split('_')[0]
    joblib.dump(le, f'{prefix}_cnn_label_encoder.pkl')
    print(f"Classes ({num_classes}): {le.classes_}")

    train_df = df[df['fold'] != 0].reset_index(drop=True)
    val_df = df[df['fold'] == 0].reset_index(drop=True)
    
    train_transform, val_transform = get_transforms()
    
    train_dataset = CropImageDataset(train_df['filepath'].values, train_df['label_idx'].values, transform=train_transform)
    val_dataset = CropImageDataset(val_df['filepath'].values, val_df['label_idx'].values, transform=val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\nUsing device: {device}")
    
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    model = model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4, weight_decay=1e-4)
    
    best_acc = 0.0
    best_model_path = f"best_cnn_resnet18_{prefix}.pth"
    
    print("\nStarting End-to-End Fine-Tuning...\n")
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * inputs.size(0)
            
        epoch_loss = running_loss / len(train_dataset)
        
        model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, preds = torch.max(outputs, 1)
                
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
                
        val_acc = accuracy_score(all_labels, all_preds)
        
        print(f"Epoch {epoch+1}/{epochs} - Train Loss: {epoch_loss:.4f} | Val Accuracy: {val_acc:.4f}")
        
        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), best_model_path)
            print(f" -> Saved new best model to {best_model_path}")

    print(f"\nTraining Complete. Best Validation Accuracy: {best_acc:.4f}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Fine-tune ResNet18 on a crop dataset")
    parser.add_argument('--csv_path', type=str, default='soybean_dataset_folds.csv', help='Path to the dataset CSV folds')
    parser.add_argument('--epochs', type=int, default=5, help='Number of epochs to train')
    args = parser.parse_args()
    
    train_model(epochs=args.epochs, csv_path=args.csv_path)
