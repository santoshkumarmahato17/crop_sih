import os
import sys
import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
import joblib

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms

from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score
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
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        
        if self.labels is not None:
            return img, self.labels[idx]
        return img

def extract_features(csv_path, embeddings_path, labels_path):
    print("Loading dataset splits...")
    df = pd.read_csv(csv_path)
    
    # We need numeric labels
    le = LabelEncoder()
    df['label_idx'] = le.fit_transform(df['target_class'])
    
    # Save the label encoder classes
    joblib.dump(le, 'label_encoder.pkl')
    print(f"Classes: {le.classes_}")

    # Set up ResNet18 for feature extraction
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device} for feature extraction")
    
    weights = models.ResNet18_Weights.DEFAULT
    resnet = models.resnet18(weights=weights)
    
    # Remove the final classification layer to get 512-dim features
    modules = list(resnet.children())[:-1]
    feature_extractor = nn.Sequential(*modules).to(device)
    feature_extractor.eval()
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    dataset = ImageDataset(df['filepath'].values, df['label_idx'].values, transform=transform)
    # Use multiple workers for fast loading if possible
    num_workers = min(4, multiprocessing.cpu_count()) if sys.platform != 'win32' else 0 # Windows DataLoader can be tricky
    dataloader = DataLoader(dataset, batch_size=128, shuffle=False, num_workers=num_workers)
    
    features = []
    labels = []
    
    print("Extracting features using ResNet18 (This might take a while)...")
    with torch.no_grad():
        for imgs, lbls in tqdm(dataloader, desc="Extracting"):
            imgs = imgs.to(device)
            # Shape is (Batch, 512, 1, 1), squeeze it to (Batch, 512)
            out = feature_extractor(imgs).squeeze(-1).squeeze(-1)
            features.append(out.cpu().numpy())
            labels.append(lbls.numpy())
            
    features = np.concatenate(features, axis=0)
    labels = np.concatenate(labels, axis=0)
    
    # We also need to save the fold assignments to keep track
    folds = df['fold'].values
    
    print(f"Extraction complete. Features shape: {features.shape}")
    
    # Save embeddings, labels, and folds
    np.save(embeddings_path, features)
    np.save(labels_path, labels)
    np.save('folds.npy', folds)
    print("Saved features, labels, and folds to disk.")
    
    return features, labels, folds, le

# ==========================================
# 2. Model Training Functions
# ==========================================

def train_lightgbm(X_train, y_train, X_val, y_val):
    print("[LightGBM] Starting training...")
    clf = lgb.LGBMClassifier(n_estimators=100, random_state=42, n_jobs=-1, verbose=-1)
    clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(stopping_rounds=10, verbose=False)])
    
    preds = clf.predict(X_val)
    acc = accuracy_score(y_val, preds)
    f1 = f1_score(y_val, preds, average='weighted')
    
    return {
        'name': 'LightGBM',
        'model': clf,
        'acc': acc,
        'f1': f1,
        'extension': '.pkl'
    }

def train_catboost(X_train, y_train, X_val, y_val):
    print("[CatBoost] Starting training...")
    clf = CatBoostClassifier(iterations=100, random_state=42, verbose=0, thread_count=-1)
    clf.fit(X_train, y_train, eval_set=(X_val, y_val), early_stopping_rounds=10)
    
    preds = clf.predict(X_val)
    acc = accuracy_score(y_val, preds)
    f1 = f1_score(y_val, preds, average='weighted')
    
    return {
        'name': 'CatBoost',
        'model': clf,
        'acc': acc,
        'f1': f1,
        'extension': '.cbm'
    }

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

def train_pytorch_mlp(X_train, y_train, X_val, y_val, num_classes=5):
    print("[PyTorch MLP] Starting training...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    model = SimpleMLP(input_dim=X_train.shape[1], num_classes=num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
    
    X_t = torch.tensor(X_train, dtype=torch.float32).to(device)
    y_t = torch.tensor(y_train, dtype=torch.long).to(device)
    X_v = torch.tensor(X_val, dtype=torch.float32).to(device)
    y_v = torch.tensor(y_val, dtype=torch.long).to(device)
    
    # Very basic training loop
    epochs = 50
    best_val_acc = 0
    best_weights = None
    
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        outputs = model(X_t)
        loss = criterion(outputs, y_t)
        loss.backward()
        optimizer.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_out = model(X_v)
            val_preds = torch.argmax(val_out, dim=1)
            acc = accuracy_score(y_v.cpu().numpy(), val_preds.cpu().numpy())
            if acc > best_val_acc:
                best_val_acc = acc
                best_weights = model.state_dict()
                
    # Load best weights
    model.load_state_dict(best_weights)
    
    # Final Eval
    model.eval()
    with torch.no_grad():
        val_out = model(X_v)
        val_preds = torch.argmax(val_out, dim=1).cpu().numpy()
        final_acc = accuracy_score(y_v.cpu().numpy(), val_preds)
        final_f1 = f1_score(y_v.cpu().numpy(), val_preds, average='weighted')
        
    return {
        'name': 'PyTorch_MLP',
        'model': model.cpu(),
        'acc': final_acc,
        'f1': final_f1,
        'extension': '.pth'
    }

# ==========================================
# 3. Main Pipeline execution
# ==========================================

def run_pipeline():
    csv_path = 'orange_dataset_folds.csv'
    features_path = 'embeddings.npy'
    labels_path = 'labels.npy'
    folds_path = 'folds.npy'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found. Please run the EDA script first.")
        return

    # Check if features exist, if not, extract them
    if os.path.exists(features_path) and os.path.exists(labels_path) and os.path.exists(folds_path):
        print("Loading pre-extracted features from disk...")
        features = np.load(features_path)
        labels = np.load(labels_path)
        folds = np.load(folds_path)
    else:
        features, labels, folds, _ = extract_features(csv_path, features_path, labels_path)
        
    # ==========================================
    # Idea 1 & 2: Feature Engineering (L2 Normalization) and Hyperparameters
    # ==========================================
    from sklearn.preprocessing import normalize
    print("Applying L2 Normalization to embeddings...")
    features = normalize(features, norm='l2')
    
    print("\n--- Starting Parallel 5-Fold Cross-Validation ---")
    results = []
    
    # We'll redefine the training functions to handle 5-fold evaluation internally or we can do it here.
    # To keep parallelization simple and avoid massive code rewrites, we will wrap the K-fold loop in a new function.
    
    def evaluate_model_kfold(model_func, model_name, features, labels, folds):
        fold_accs = []
        fold_f1s = []
        best_model = None
        best_fold_acc = 0
        
        print(f"[{model_name}] Starting 5-Fold CV...")
        for k in range(5):
            X_train, y_train = features[folds != k], labels[folds != k]
            X_val, y_val = features[folds == k], labels[folds == k]
            
            res = model_func(X_train, y_train, X_val, y_val)
            fold_accs.append(res['acc'])
            fold_f1s.append(res['f1'])
            
            if res['acc'] > best_fold_acc:
                best_fold_acc = res['acc']
                best_model = res['model']
                
        avg_acc = np.mean(fold_accs)
        avg_f1 = np.mean(fold_f1s)
        
        return {
            'name': model_name,
            'model': best_model,
            'acc': avg_acc,
            'f1': avg_f1,
            'extension': res['extension']
        }

    # Redefine models with Idea 3: Hyperparameter Tuning (Regularization)
    def train_lightgbm_tuned(X_train, y_train, X_val, y_val):
        clf = lgb.LGBMClassifier(n_estimators=150, learning_rate=0.05, reg_lambda=0.1, max_depth=6, random_state=42, n_jobs=-1, verbose=-1)
        clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], callbacks=[lgb.early_stopping(stopping_rounds=15, verbose=False)])
        preds = clf.predict(X_val)
        return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.pkl'}

    def train_catboost_tuned(X_train, y_train, X_val, y_val):
        clf = CatBoostClassifier(iterations=150, learning_rate=0.05, l2_leaf_reg=3, depth=6, random_state=42, verbose=0, thread_count=-1)
        clf.fit(X_train, y_train, eval_set=(X_val, y_val), early_stopping_rounds=15)
        preds = clf.predict(X_val)
        return {'acc': accuracy_score(y_val, preds), 'f1': f1_score(y_val, preds, average='weighted'), 'model': clf, 'extension': '.cbm'}

    with ThreadPoolExecutor(max_workers=3) as executor:
        f_lgb = executor.submit(evaluate_model_kfold, train_lightgbm_tuned, 'LightGBM', features, labels, folds)
        f_cat = executor.submit(evaluate_model_kfold, train_catboost_tuned, 'CatBoost', features, labels, folds)
        f_mlp = executor.submit(evaluate_model_kfold, train_pytorch_mlp, 'PyTorch_MLP', features, labels, folds)
        
        futures = {f_lgb: 'LightGBM', f_cat: 'CatBoost', f_mlp: 'PyTorch_MLP'}
        
        for future in as_completed(futures):
            model_name = futures[future]
            try:
                res = future.result()
                results.append(res)
                print(f"[Completed] {model_name} (5-Fold Avg) -> Acc: {res['acc']:.4f}, F1: {res['f1']:.4f}")
            except Exception as e:
                print(f"[Error] {model_name} generated an exception: {e}")
                
    if not results:
        print("All models failed to train.")
        return
        
    print("\n--- Final 5-Fold Validation Metrics ---")
    best_acc = 0
    best_model_info = None
    
    for r in results:
        print(f"{r['name'].ljust(15)} - Avg Accuracy: {r['acc']:.4f} | Avg F1-Score: {r['f1']:.4f}")
        if r['acc'] > best_acc:
            best_acc = r['acc']
            best_model_info = r
            
    print(f"\nBest Model Overall: {best_model_info['name']} (Avg Accuracy: {best_acc:.4f})")
    
    # Save the best model
    save_path = f"best_model_{best_model_info['name'].lower()}{best_model_info['extension']}"
    
    if best_model_info['name'] == 'LightGBM':
        joblib.dump(best_model_info['model'], save_path)
    elif best_model_info['name'] == 'CatBoost':
        best_model_info['model'].save_model(save_path)
    elif best_model_info['name'] == 'PyTorch_MLP':
        torch.save(best_model_info['model'].state_dict(), save_path)
        
    print(f"Saved best model weights to {save_path}")

if __name__ == '__main__':
    # Required for Windows multiprocessing
    multiprocessing.freeze_support()
    run_pipeline()
