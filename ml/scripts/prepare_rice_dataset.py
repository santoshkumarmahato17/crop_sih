import os
import shutil
import random

def main():
    source_dir = "ml/data/rice_leaf_diseases"
    target_dir = "ml/data/rice"
    
    if not os.path.exists(source_dir):
        print(f"Source directory {source_dir} not found. Ensure Kaggle dataset is downloaded and unzipped.")
        return

    classes = [d for d in os.listdir(source_dir) if os.path.isdir(os.path.join(source_dir, d))]
    
    if not classes:
        print(f"No class directories found in {source_dir}. Check dataset extraction.")
        return

    # Create train and val directories
    for split in ['train', 'val']:
        for cls in classes:
            os.makedirs(os.path.join(target_dir, split, cls), exist_ok=True)

    for cls in classes:
        cls_dir = os.path.join(source_dir, cls)
        images = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        random.seed(42)
        random.shuffle(images)
        
        # 80/20 split
        split_idx = int(0.8 * len(images))
        train_imgs = images[:split_idx]
        val_imgs = images[split_idx:]
        
        for img in train_imgs:
            shutil.copy(os.path.join(cls_dir, img), os.path.join(target_dir, 'train', cls, img))
            
        for img in val_imgs:
            shutil.copy(os.path.join(cls_dir, img), os.path.join(target_dir, 'val', cls, img))
            
        print(f"Class '{cls}': {len(train_imgs)} training, {len(val_imgs)} validation.")
        
    print(f"Dataset preparation complete. Placed in {target_dir}")

if __name__ == "__main__":
    main()
