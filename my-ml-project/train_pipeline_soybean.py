import os
import sys
import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, as_completed
import joblib

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms

from sklearn.preprocessing import LabelEncoder, normalize
from sklearn.metrics import accuracy_score, f1_score
from sklearn.utils.class_weight import compute_class_weight
import lightgbm as lgb
from catboost import CatBoostClassifier

try:
    from imblearn.over_sampling import SMOTE
except ImportError:
    SMOTE = None
    print("Warning: imbalanced-learn not installed. Skipping SMOTE.")

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
        img = Image.open(path).convert('RGB')
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
    joblib.dump(le, 'soybean_label_encoder.pkl')

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
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
    
    dataset = ImageDataset(df['filepath'].values, df['label_idx'].values, transform=transform)
    num_workers = min(4, multiprocessing.cpu_count()) if sys.platform != 'win32' else 0
    dataloader = DataLoader(dataset, batch_size=128, shuffle=False, num_workers=num_workers)
    
    features = []
    labels = []
    
    with torch.no_grad():
        for imgs, lbls in tqdm(dataloader, desc="Extracting"):
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
# 2. Model Training Functions (With SMOTE & Class Weights & Schedulers)
# ==========================================

def train_lightgbm_tuned(X_train, y_train, X_val, y_val, class_weights=None):
    # Idea 1: class_weight='balanced'
    clf = lgb.LGBMClassifier(n_estimators=150, learning_rate=0.05, reg_lambda=0.1, max_depth=6, class_weight='balanced', random_state=42, n_jobs=-1, verbose=-1)
    clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(stopping_rounds=15, verbose=False)])
    preds = clf.predict(X_val)
    return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.pkl'}

def train_catboost_tuned(X_train, y_train, X_val, y_val, class_weights=None):
    # Idea 1: auto_class_weights='Balanced'
    clf = CatBoostClassifier(iterations=150, learning_rate=0.05, l2_leaf_reg=3, depth=6, auto_class_weights='Balanced', random_state=42, verbose=0, thread_count=-1)
    clf.fit(X_train, y_train, eval_set=(X_val, y_val), early_stopping_rounds=15)
    preds = clf.predict(X_val)
    return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.cbm'}

class SimpleMLP(nn.Module):
    def __init__(self, input_dim, num_classes):
        super(SimpleMLP, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )
    def forward(self, x):
        return self.net(x)

def train_pytorch_mlp(X_train, y_train, X_val, y_val, num_classes, class_weights=None):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SimpleMLP(input_dim=X_train.shape[1], num_classes=num_classes).to(device)
    
    # Idea 1 & 3: Class weights in Loss and Weight Decay
    weight_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device) if class_weights is not None else None
    criterion = nn.CrossEntropyLoss(weight=weight_tensor)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
    # Idea 3: Learning Rate Scheduler
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    X_t = torch.tensor(X_train, dtype=torch.float32).to(device)
    y_t = torch.tensor(y_train, dtype=torch.long).to(device)
    X_v = torch.tensor(X_val, dtype=torch.float32).to(device)
    y_v = torch.tensor(y_val, dtype=torch.long).to(device)
    
    epochs = 80
    best_val_acc = 0
    best_weights = None
    
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        outputs = model(X_t)
        loss = criterion(outputs, y_t)
        loss.backward()
        optimizer.step()
        
        model.eval()
        with torch.no_grad():
            val_out = model(X_v)
            val_preds = torch.argmax(val_out, dim=1)
            acc = accuracy_score(y_v.cpu().numpy(), val_preds.cpu().numpy())
            
            if acc > best_val_acc:
                best_val_acc = acc
                best_weights = model.state_dict()
                
        scheduler.step(acc)
                
    model.load_state_dict(best_weights)
    model.eval()
    with torch.no_grad():
        val_out = model(X_v)
        val_preds = torch.argmax(val_out, dim=1).cpu().numpy()
        final_acc = accuracy_score(y_v.cpu().numpy(), val_preds)
        final_f1 = f1_score(y_v.cpu().numpy(), val_preds, average='weighted')
        
    return {'name': 'PyTorch_MLP', 'model': model.cpu(), 'acc': final_acc, 'f1': final_f1, 'extension': '.pth'}

# ==========================================
# 3. Main Pipeline execution
# ==========================================

def evaluate_model_kfold(model_func, model_name, features, labels, folds, num_classes):
    fold_accs = []
    fold_f1s = []
    best_model = None
    best_fold_acc = 0
    
    print(f"[{model_name}] Starting 5-Fold CV with SMOTE and Class Weights...")
    for k in range(5):
        X_train, y_train = features[folds != k], labels[folds != k]
        X_val, y_val = features[folds == k], labels[folds == k]
        
        # Calculate class weights for this fold
        c_weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
        
        # Idea 2: SMOTE oversampling for minority classes
        if SMOTE is not None:
            sm = SMOTE(random_state=42, k_neighbors=3) # low k because smallest class has ~8 samples in train
            try:
                X_train, y_train = sm.fit_resample(X_train, y_train)
            except Exception as e:
                pass # Fallback if SMOTE fails on tiny classes
        
        if model_name == 'PyTorch_MLP':
            res = model_func(X_train, y_train, X_val, y_val, num_classes, c_weights)
        else:
            res = model_func(X_train, y_train, X_val, y_val, c_weights)
            
        fold_accs.append(res['acc'])
        fold_f1s.append(res['f1'])
        
        if res['acc'] > best_fold_acc:
            best_fold_acc = res['acc']
            best_model = res['model']
            
    return {
        'name': model_name,
        'model': best_model,
        'acc': np.mean(fold_accs),
        'f1': np.mean(fold_f1s),
        'extension': res['extension']
    }

def run_pipeline():
    csv_path = 'soybean_dataset_folds.csv'
    features_path = 'soybean_embeddings.npy'
    labels_path = 'soybean_labels.npy'
    folds_path = 'soybean_folds.npy'
    
    if os.path.exists(features_path):
        features = np.load(features_path)
        labels = np.load(labels_path)
        folds = np.load(folds_path)
    else:
        features, labels, folds, _ = extract_features(csv_path, features_path, labels_path, folds_path)
        
    features = normalize(features, norm='l2')
    num_classes = len(np.unique(labels))
    
    print(f"\n--- Starting Advanced Parallel 5-Fold Cross-Validation for {num_classes} classes ---")
    results = []
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_lgb = executor.submit(evaluate_model_kfold, train_lightgbm_tuned, 'LightGBM', features, labels, folds, num_classes)
        f_cat = executor.submit(evaluate_model_kfold, train_catboost_tuned, 'CatBoost', features, labels, folds, num_classes)
        f_mlp = executor.submit(evaluate_model_kfold, train_pytorch_mlp, 'PyTorch_MLP', features, labels, folds, num_classes)
        
        futures = {f_lgb: 'LightGBM', f_cat: 'CatBoost', f_mlp: 'PyTorch_MLP'}
        for future in as_completed(futures):
            model_name = futures[future]
            try:
                res = future.result()
                results.append(res)
                print(f"[Completed] {model_name} (5-Fold Avg) -> Acc: {res['acc']:.4f}, F1: {res['f1']:.4f}")
            except Exception as e:
                print(f"[Error] {model_name} generated an exception: {e}")
                
    if not results: return
        
    print("\n--- Final Advanced 5-Fold Validation Metrics ---")
    best_acc = 0
    best_model_info = None
    
    for r in results:
        print(f"{r['name'].ljust(15)} - Avg Accuracy: {r['acc']:.4f} | Avg F1-Score: {r['f1']:.4f}")
        if r['acc'] > best_acc:
            best_acc = r['acc']
            best_model_info = r
            
    print(f"\nBest Model Overall: {best_model_info['name']} (Avg Accuracy: {best_acc:.4f})")
    
    save_path = f"best_soybean_model_{best_model_info['name'].lower()}{best_model_info['extension']}"
    if best_model_info['name'] == 'LightGBM':
        joblib.dump(best_model_info['model'], save_path)
    elif best_model_info['name'] == 'CatBoost':
        best_model_info['model'].save_model(save_path)
    elif best_model_info['name'] == 'PyTorch_MLP':
        torch.save(best_model_info['model'].state_dict(), save_path)
        
    print(f"Saved best model weights to {save_path}")

if __name__ == '__main__':
    multiprocessing.freeze_support()
    run_pipeline()
