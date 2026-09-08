import os
import json

# Master mapping from folder name to class info
CLASS_MAPPING = {
    "Citrus_Canker_Diseases_Leaf_Orange": {
        "id": 0,
        "original_label": "citrus_canker",
        "display_name": "Citrus Canker",
        "category": "Disease",
        "description": "Bacterial disease causing lesions on leaves.",
        "common_symptoms": "Raised, corky lesions with yellow halos.",
        "basic_recommendation": "Use copper-based bactericides and remove infected plant parts."
    },
    "Citrus_Nutrient_Deficiency_Yellow_Leaf_Orange": {
        "id": 1,
        "original_label": "citrus_Nutrient yellow",
        "display_name": "Citrus Nutrient Yellow",
        "category": "Nutrient Deficiency / Leaf Disorder",
        "description": "Yellowing of leaves due to lack of essential nutrients (often Nitrogen or Magnesium).",
        "common_symptoms": "Yellowing of the entire leaf or between veins.",
        "basic_recommendation": "Apply appropriate citrus fertilizer containing micronutrients."
    },
    "Multiple_Diseases_Leaf_Orange": {
        "id": 2,
        "original_label": "healthy_leaf_orange_multiple disease",
        "display_name": "Orange Leaf - Multiple Disease",
        "category": "Disease",
        "description": "Leaf exhibiting symptoms of more than one disease simultaneously.",
        "common_symptoms": "Varied, combination of spots, lesions, and discoloration.",
        "basic_recommendation": "Consult an agricultural extension for proper diagnosis and broad-spectrum treatment."
    },
    "Young_Healthy_Leaf_Orange": {
        "id": 3,
        "original_label": "young:healthy_leaf_orange",
        "display_name": "Young Healthy Orange Leaf",
        "category": "Healthy / Young Leaf",
        "description": "A newly grown, healthy orange leaf.",
        "common_symptoms": "None. Light green color.",
        "basic_recommendation": "Maintain regular watering and fertilization schedule."
    },
    "Healthy_Leaf_Orange": {
        "id": 4,
        "original_label": "healthy",
        "display_name": "Healthy Orange Leaf",
        "category": "Healthy",
        "description": "A fully mature, healthy orange leaf.",
        "common_symptoms": "None. Dark green color.",
        "basic_recommendation": "Maintain regular care."
    }
}

def get_class_id(folder_name):
    return CLASS_MAPPING.get(folder_name, {}).get("id", -1)

def save_mapping(output_path):
    # Format according to user request
    formatted_mapping = {}
    for folder, data in CLASS_MAPPING.items():
        formatted_mapping[str(data["id"])] = {
            "original_label": data["original_label"],
            "display_name": data["display_name"],
            "category": data["category"]
        }
    with open(output_path, "w") as f:
        json.dump(formatted_mapping, f, indent=4)

    # Save metadata separately
    with open(output_path.replace("class_names.json", "model_metadata.json"), "w") as f:
        json.dump(list(CLASS_MAPPING.values()), f, indent=4)
