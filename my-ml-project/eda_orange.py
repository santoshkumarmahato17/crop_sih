import os
import pandas as pd
import numpy as np
from PIL import Image
from sklearn.model_selection import StratifiedKFold
import matplotlib.pyplot as plt
import seaborn as sns

def perform_eda_and_split(dataset_dir: str, output_csv: str = 'orange_dataset_folds.csv'):
    print(f"Starting EDA for dataset at: {dataset_dir}")
    
    if not os.path.exists(dataset_dir):
        print(f"Error: Directory {dataset_dir} does not exist.")
        return

    data = []
    
    # Iterate through class folders
    classes = [d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))]
    print(f"Found {len(classes)} classes: {classes}")
    
    for cls in classes:
        cls_dir = os.path.join(dataset_dir, cls)
        for img_name in os.listdir(cls_dir):
            if not img_name.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                continue
                
            img_path = os.path.join(cls_dir, img_name)
            
            try:
                with Image.open(img_path) as img:
                    width, height = img.size
                    mode = img.mode
                
                data.append({
                    'image_path': img_path,
                    'filename': img_name,
                    'target_class': cls,
                    'width': width,
                    'height': height,
                    'channels': len(img.getbands()),
                    'mode': mode
                })
            except Exception as e:
                print(f"Error reading {img_path}: {e}")

    df = pd.DataFrame(data)
    
    if len(df) == 0:
        print("No images found in dataset.")
        return
        
    print("\n--- Exploratory Data Analysis (EDA) ---")
    print(f"Total images found: {len(df)}")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print("\nMissing values in dataset:")
    print(missing_values)
    
    # Target column distribution
    print("\nTarget Class Distribution:")
    class_dist = df['target_class'].value_counts()
    print(class_dist)
    
    # Image size analysis
    print("\nImage Dimensions Analysis:")
    print("Unique image sizes (width x height):")
    size_counts = df.groupby(['width', 'height']).size().reset_index(name='count')
    print(size_counts)
    
    # Implementing 5-Fold Cross Validation
    print("\n--- Implementing 5-Fold Stratified Cross Validation ---")
    # Using StratifiedKFold to maintain class distribution across folds
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    df['fold'] = -1
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(df, df['target_class'])):
        df.loc[val_idx, 'fold'] = fold
        
    print("Cross Validation Split Distribution (Folds):")
    print(pd.crosstab(df['fold'], df['target_class']))
    
    # Save the dataframe with folds
    df.to_csv(output_csv, index=False)
    print(f"\nDataset with CV folds saved to: {output_csv}")
    
    # Plotting (optional, saved to file)
    try:
        plt.figure(figsize=(10, 6))
        sns.countplot(data=df, y='target_class', hue='fold')
        plt.title('Class Distribution across 5 Folds')
        plt.tight_layout()
        plt.savefig(os.path.join(os.path.dirname(output_csv), 'orange_eda_folds.png'))
        print("Saved fold distribution plot to 'orange_eda_folds.png'")
    except Exception as e:
        print(f"Could not generate plot: {e}")

if __name__ == "__main__":
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dataset orange'))
    output_path = os.path.join(os.path.dirname(__file__), 'orange_dataset_folds.csv')
    perform_eda_and_split(dataset_path, output_path)
