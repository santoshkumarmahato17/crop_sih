import os
import glob
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedKFold
from PIL import Image

def perform_eda_and_cv(dataset_path, output_dir):
    print(f"--- Starting EDA for dataset at: {dataset_path} ---")
    
    # 1. Gather all images and identify the target (class labels)
    classes = [d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))]
    
    # Ignore accidental folders if necessary, but we'll list them all
    print(f"\nIdentified Target Classes ({len(classes)}): {classes}")
    
    data = []
    corrupted_files = []
    
    print("\nScanning images and checking for corruption (missing/invalid values)...")
    for cls in classes:
        cls_path = os.path.join(dataset_path, cls)
        for ext in ('*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG'):
            for img_path in glob.glob(os.path.join(cls_path, ext)):
                # 2. Check for "missing values" or corrupted images
                try:
                    with Image.open(img_path) as img:
                        img.verify()
                    data.append({'filepath': img_path, 'target_class': cls})
                except Exception as e:
                    corrupted_files.append(img_path)
                    
    df = pd.DataFrame(data)
    
    print("\n--- Data Summary ---")
    print(f"Total valid images: {len(df)}")
    print(f"Total corrupted/invalid images found: {len(corrupted_files)}")
    if corrupted_files:
        print("Corrupted files sample:", corrupted_files[:5])
        
    if len(df) == 0:
        print("No valid images found. Exiting.")
        return

    # Class distribution
    print("\nClass Distribution:")
    class_counts = df['target_class'].value_counts()
    print(class_counts)
    
    # Plot class distribution
    plt.figure(figsize=(12, 6))
    class_counts.plot(kind='bar', color='tomato')
    plt.title('Class Distribution for Tomato Dataset')
    plt.xlabel('Target Class')
    plt.ylabel('Number of Images')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plot_path = os.path.join(output_dir, "tomato_class_distribution.png")
    plt.savefig(plot_path)
    print(f"\nSaved class distribution plot to {os.path.abspath(plot_path)}")
    
    # 3. Robust 5-fold Cross-Validation Strategy
    print("\n--- Implementing 5-Fold Stratified Cross-Validation ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    df['fold'] = -1
    
    # Ensure there are enough samples in each class for 5 splits
    # StratifiedKFold will complain if any class has < 5 samples
    min_class_count = class_counts.min()
    if min_class_count < 5:
        print(f"WARNING: The smallest class has only {min_class_count} samples. Stratified 5-Fold requires at least 5.")
        print("Removing classes with fewer than 5 samples to prevent data leakage/crash...")
        valid_classes = class_counts[class_counts >= 5].index
        df = df[df['target_class'].isin(valid_classes)].reset_index(drop=True)
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(df['filepath'], df['target_class'])):
        df.loc[val_idx, 'fold'] = fold
        
    print("\nFold Distribution (Rows=Folds, Columns=Classes):")
    print(pd.crosstab(df['fold'], df['target_class']))
    
    # Save the splits to a CSV
    output_csv = os.path.join(output_dir, "tomato_dataset_folds.csv")
    df.to_csv(output_csv, index=False)
    print(f"\nSaved dataset split definitions to {os.path.abspath(output_csv)}")

if __name__ == "__main__":
    dataset_path = r"C:\Users\krsan\Desktop\crop\dataset Tomato"
    output_dir = r"C:\Users\krsan\Desktop\crop\my-ml-project"
    
    if not os.path.exists(dataset_path):
        print(f"Dataset path {dataset_path} does not exist.")
    else:
        perform_eda_and_cv(dataset_path, output_dir)
