import json, glob, os

reports = glob.glob('c:/Users/krsan/Desktop/New folder/crop_sih/ml/reports*/dataset_report.json')

results = []
for r in reports:
    try:
        with open(r, 'r') as f:
            data = json.load(f)
            
            crop_name = data.get('dataset_name', os.path.basename(os.path.dirname(r)))
            
            total = data.get('total_images_scanned') or data.get('total_discovered') or data.get('total_valid') or 'N/A'
            if total == 'N/A' and 'splits_summary' in data:
                total = data['splits_summary'].get('total_images', 'N/A')
            if total == 'N/A' and 'train_dataset' in data:
                 total = data['train_dataset'].get('total_images', 'N/A')
            
            train = 'N/A'
            val = 'N/A'
            test = 'N/A'
            
            splits = data.get('splits_summary', {})
            if splits:
                if 'train_count' in splits:
                    train = splits.get('train_count')
                    val = splits.get('val_count')
                    test = splits.get('test_count')
                elif 'train' in splits:
                    train = splits['train'].get('total', 'N/A')
                    val = splits.get('validation', {}).get('total', 'N/A')
                    test = splits.get('test', {}).get('total', 'N/A')
            
            results.append({
                'dataset': crop_name,
                'total': total,
                'train': train,
                'val': val,
                'test': test
            })
    except Exception as e:
        print(f'Error reading {r}: {e}')

print('--- DATASET SUMMARY ---')
for res in results:
    print(f"{res['dataset']} | Total: {res['total']} | Train: {res['train']} | Val: {res['val']} | Test: {res['test']}")
