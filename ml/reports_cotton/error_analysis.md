# Cotton Leaf Disease  Error Analysis

**Test Accuracy**: 94.39%

**Macro F1**: 94.39%


## Per-Class Performance

| Class | Precision | Recall | F1 | Support |
|-------|-----------|--------|-----|---------|
| Bacterial Blight | 82.8% | 96.0% | 88.9% | 25.0 |
| Curl Virus | 95.5% | 97.7% | 96.6% | 43.0 |
| Healthy Leaf | 96.3% | 100.0% | 98.1% | 26.0 |
| Herbicide Growth Damage | 100.0% | 100.0% | 100.0% | 28.0 |
| Leaf Hopper Jassids | 82.6% | 82.6% | 82.6% | 23.0 |
| Leaf Redding | 100.0% | 89.7% | 94.5% | 58.0 |
| Leaf Variegation | 100.0% | 100.0% | 100.0% | 11.0 |

## Best Performing Class: **Herbicide Growth Damage** (F1: 100.0%)
## Worst Performing Class: **Leaf Hopper Jassids** (F1: 82.6%)

## Most Confused Class Pairs

- **Leaf Hopper Jassids** misclassified as **Bacterial Blight**: 3 times
- **Leaf Redding** misclassified as **Leaf Hopper Jassids**: 3 times
- **Leaf Redding** misclassified as **Bacterial Blight**: 2 times
- **Bacterial Blight** misclassified as **Leaf Hopper Jassids**: 1 times
- **Curl Virus** misclassified as **Healthy Leaf**: 1 times
- **Leaf Hopper Jassids** misclassified as **Curl Virus**: 1 times
- **Leaf Redding** misclassified as **Curl Virus**: 1 times

## Recommendations

- Collect more images for underrepresented classes
- Use stronger augmentation for minority classes
- Consider focal loss if class imbalance persists
- Verify label quality for the most confused pairs