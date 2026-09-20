import os
import sys
import numpy as np
import pandas as pd
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
from tqdm import tqdm
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, as_completed
import joblib

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms

from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
from sklearn.utils.class_weight import compute_class_weight
import lightgbm as lgb
from catboost import CatBoostClassifier

# ==========================================
# 1. Dataset & Feature Extraction
# ==========================================

class ImageDataset(Dataset):
    def __init__(self, filepaths, labels=None, transform=None):
        self.filepaths = filepaths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.filepaths)

    def __getitem__(self, idx):
        path = self.filepaths[idx]
        try:
            img = Image.open(path).convert('RGB')
        except Exception:
            # Fallback for corrupt images
            img = Image.new('RGB', (224, 224), (0, 0, 0))
            
        if self.transform:
            img = self.transform(img)
        if self.labels is not None:
            return img, self.labels[idx]
        return img

def extract_features(csv_path, embeddings_path, labels_path, folds_path):
    print("Loading dataset splits...")
    df = pd.read_csv(csv_path)
    
    le = LabelEncoder()
    df['label_idx'] = le.fit_transform(df['target_class'])
    joblib.dump(le, 'orange_label_encoder.pkl')

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device} for feature extraction.")
    
    weights = models.ResNet18_Weights.DEFAULT
    resnet = models.resnet18(weights=weights)
    modules = list(resnet.children())[:-1]
    feature_extractor = nn.Sequential(*modules).to(device)
    feature_extractor.eval()
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    dataset = ImageDataset(df['image_path'].values, df['label_idx'].values, transform=transform)
    num_workers = min(4, multiprocessing.cpu_count()) if sys.platform != 'win32' else 0
    dataloader = DataLoader(dataset, batch_size=128, shuffle=False, num_workers=num_workers)
    
    features = []
    labels = []
    
    with torch.no_grad():
        for imgs, lbls in tqdm(dataloader, desc="Extracting ResNet18 Features"):
            imgs = imgs.to(device)
            out = feature_extractor(imgs).squeeze(-1).squeeze(-1)
            features.append(out.cpu().numpy())
            labels.append(lbls.numpy())
            
    features = np.concatenate(features, axis=0)
    labels = np.concatenate(labels, axis=0)
    folds = df['fold'].values
    
    np.save(embeddings_path, features)
    np.save(labels_path, labels)
    np.save(folds_path, folds)
    
    return features, labels, folds, le

# ==========================================
# 2. Model Training Functions
# ==========================================

from sklearn.decomposition import PCA

def train_lightgbm(X_train, y_train, X_val, y_val, class_weights=None):
    clf = lgb.LGBMClassifier(n_estimators=200, learning_rate=0.03, max_depth=6, class_weight='balanced', random_state=42, n_jobs=-1, verbose=-1)
    clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(stopping_rounds=20, verbose=False)])
    preds = clf.predict(X_val)
    return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.pkl', 'name': 'LightGBM'}

def train_catboost(X_train, y_train, X_val, y_val, class_weights=None):
    # Idea 3: Tuned CatBoost with l2_leaf_reg and deeper depth
    clf = CatBoostClassifier(iterations=250, learning_rate=0.08, depth=6, l2_leaf_reg=3, auto_class_weights='Balanced', random_state=42, verbose=0, thread_count=-1)
    clf.fit(X_train, y_train, eval_set=(X_val, y_val), early_stopping_rounds=25)
    preds = clf.predict(X_val)
    return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.cbm', 'name': 'CatBoost'}

class SimpleMLP(nn.Module):
    # Idea 2: Adjusted MLP capacity and added stronger dropout
    def __init__(self, input_dim, num_classes):
        super(SimpleMLP, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, num_classes)
        )
    def forward(self, x):
        return self.net(x)

def train_pytorch_mlp(X_train, y_train, X_val, y_val, num_classes, class_weights=None):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SimpleMLP(input_dim=X_train.shape[1], num_classes=num_classes).to(device)
    
    weight_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device) if class_weights is not None else None
    criterion = nn.CrossEntropyLoss(weight=weight_tensor)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=5e-4, weight_decay=1e-3)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=4)
    
    X_t = torch.tensor(X_train, dtype=torch.float32).to(device)
    y_t = torch.tensor(y_train, dtype=torch.long).to(device)
    X_v = torch.tensor(X_val, dtype=torch.float32).to(device)
    y_v = torch.tensor(y_val, dtype=torch.long).to(device)
    
    epochs = 50
    best_val_acc = 0
    best_weights = None
    
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        out = model(X_t)
        loss = criterion(out, y_t)
        loss.backward()
        optimizer.step()
        
        model.eval()
        with torch.no_grad():
            val_out = model(X_v)
            val_preds = torch.argmax(val_out, dim=1)
            val_acc = accuracy_score(y_val, val_preds.cpu().numpy())
            
        scheduler.step(val_acc)
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            
    model.load_state_dict(best_weights)
    model.eval()
    with torch.no_grad():
        final_val_preds = torch.argmax(model(X_v), dim=1).cpu().numpy()
        final_f1 = f1_score(y_val, final_val_preds, average='weighted')
        
    return {'acc': best_val_acc, 'f1': final_f1, 'model': best_weights, 'extension': '.pt', 'name': 'PyTorch_MLP'}

# ==========================================
# 3. Main Pipeline
# ==========================================

def run_pipeline():
    csv_path = 'orange_dataset_folds.csv'
    emb_path = 'orange_embeddings.npy'
    lbl_path = 'orange_labels.npy'
    fold_path = 'orange_folds.npy'
    
    if os.path.exists(emb_path) and os.path.exists(lbl_path) and os.path.exists(fold_path):
        print("Found cached embeddings. Loading...")
        X = np.load(emb_path)
        y = np.load(lbl_path)
        folds = np.load(fold_path)
        le = joblib.load('orange_label_encoder.pkl')
    else:
        print("Extracting features (this may take a while)...")
        X, y, folds, le = extract_features(csv_path, emb_path, lbl_path, fold_path)
        
    num_classes = len(np.unique(y))
    print(f"\nExtracted Features Shape: {X.shape}, Target Shape: {y.shape}")
    
    # Idea 1: PCA Dimensionality Reduction to denoise embeddings
    print("Applying PCA to reduce embedding dimensions (variance=99%)...")
    pca = PCA(n_components=0.99, random_state=42)
    X = pca.fit_transform(X)
    print(f"Reduced Features Shape: {X.shape}")
    
    print("\n--- Training Models (Parallel) ---")
    
    # We will use fold 0 for validation, remaining folds for training (as requested by 'cross-validation split' strategy)
    train_idx = np.where(folds != 0)[0]
    val_idx = np.where(folds == 0)[0]
    
    X_train, y_train = X[train_idx], y[train_idx]
    X_val, y_val = X[val_idx], y[val_idx]
    
    print(f"Train samples: {len(X_train)}, Validation samples: {len(X_val)}")
    
    cw = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    
    # Run training in parallel
    models_info = [
        (train_lightgbm, (X_train, y_train, X_val, y_val, cw)),
        (train_catboost, (X_train, y_train, X_val, y_val, cw)),
        (train_pytorch_mlp, (X_train, y_train, X_val, y_val, num_classes, cw))
    ]
    
    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(fn, *args): fn.__name__ for fn, args in models_info}
        for future in as_completed(futures):
            name = futures[future]
            try:
                res = future.result()
                results.append(res)
                print(f"[Done] {res['name']} -> Val Acc: {res['acc']:.4f}, Val F1: {res['f1']:.4f}")
            except Exception as e:
                print(f"[Failed] {name}: {e}")
                
    if not results:
        print("All models failed!")
        return
        
    print("\n--- Scoreboard ---")
    results = sorted(results, key=lambda x: x['f1'], reverse=True)
    for i, res in enumerate(results, 1):
        print(f"{i}. {res['name']} - Acc: {res['acc']:.4f}, F1: {res['f1']:.4f}")
        
    best = results[0]
    print(f"\nBest Model: {best['name']} with F1: {best['f1']:.4f}")
    
    model_save_path = f"best_orange_model{best['extension']}"
    if best['name'] == 'PyTorch_MLP':
        torch.save(best['model'], model_save_path)
    elif best['name'] == 'CatBoost':
        best['model'].save_model(model_save_path)
    else:
        joblib.dump(best['model'], model_save_path)
        
    print(f"Saved best model weights to '{model_save_path}'")

if __name__ == "__main__":
    run_pipeline()
