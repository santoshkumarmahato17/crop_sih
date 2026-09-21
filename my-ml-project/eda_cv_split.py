import os
import glob
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedKFold
from PIL import Image

def perform_eda_and_cv(dataset_path, output_dir):
    print(f"--- Starting EDA for dataset at: {dataset_path} ---")
    
    # 1. Gather all images and identify the target (class labels)
    # The 'target column' in an image dataset corresponds to the directory name of the class.
    classes = [d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))]
    print(f"\nIdentified Target Classes ({len(classes)}): {classes}")
    
    data = []
    corrupted_files = []
    
    print("\nScanning images and checking for corruption (missing/invalid values)...")
    for cls in classes:
        cls_path = os.path.join(dataset_path, cls)
        # Check common image extensions
        for ext in ('*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG'):
            for img_path in glob.glob(os.path.join(cls_path, ext)):
                # 2. Check for "missing values" or corrupted images
                try:
                    with Image.open(img_path) as img:
                        img.verify() # verify that it is, in fact, a valid image
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
    class_counts.plot(kind='bar', color='skyblue')
    plt.title('Class Distribution for Orange Dataset')
    plt.xlabel('Target Class')
    plt.ylabel('Number of Images')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plot_path = os.path.join(output_dir, "class_distribution.png")
    plt.savefig(plot_path)
    print(f"\nSaved class distribution plot to {os.path.abspath(plot_path)}")
    
    # 3. Robust 5-fold Cross-Validation Strategy
    # Using StratifiedKFold to maintain class balance across all folds
    # and to prevent data leakage (each image appears in the test set exactly once).
    print("\n--- Implementing 5-Fold Stratified Cross-Validation ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    df['fold'] = -1
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(df['filepath'], df['target_class'])):
        df.loc[val_idx, 'fold'] = fold
        
    print("\nFold Distribution (Rows=Folds, Columns=Classes):")
    print(pd.crosstab(df['fold'], df['target_class']))
    
    # Save the splits to a CSV for reproducible training
    output_csv = os.path.join(output_dir, "orange_dataset_folds.csv")
    df.to_csv(output_csv, index=False)
    print(f"\nSaved dataset split definitions to {os.path.abspath(output_csv)}")
    print("This CSV contains 'filepath', 'target_class', and 'fold' (0-4) to ensure no data leakage during training.")

if __name__ == "__main__":
    dataset_path = r"C:\Users\krsan\Desktop\crop\dataset orange"
    output_dir = r"C:\Users\krsan\Desktop\crop\my-ml-project"
    
    if not os.path.exists(dataset_path):
        print(f"Dataset path {dataset_path} does not exist.")
    else:
        perform_eda_and_cv(dataset_path, output_dir)
