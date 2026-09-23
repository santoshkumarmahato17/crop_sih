"""
AGRI SHIELD — CCMT (Cashew, Cassava, Maize, Tomato) Crop Pest & Disease Classifier.
PyTorch Vision Architecture covering 22 pathological conditions across 4 staple crops.
"""

from typing import Any, Dict, List, Optional, Tuple
try:
    import torch
    import torch.nn as nn
    import torchvision.models as models
except ImportError:
    class _DummyTorch:
        Tensor = object
    torch = _DummyTorch()
    class _DummyModule:
        def __init__(self, *args, **kwargs): pass
        def to(self, *args, **kwargs): return self
        def eval(self, *args, **kwargs): return self
    class _DummyNN:
        Module = _DummyModule
    nn = _DummyNN()
    models = None

# ------------------------------------------------------------------------------
# 22 Normalized Class Taxonomy for CCMT Dataset
# ------------------------------------------------------------------------------
CCMT_CLASSES = [
    # 1. Cashew (5 classes)
    "cashew_anthracnose",
    "cashew_gumosis",
    "cashew_healthy",
    "cashew_leaf_miner",
    "cashew_red_rust",
    # 2. Cassava (5 classes)
    "cassava_bacterial_blight",
    "cassava_brown_spot",
    "cassava_green_mite",
    "cassava_healthy",
    "cassava_mosaic",
    # 3. Maize (7 classes)
    "maize_fall_armyworm",
    "maize_grasshopper",
    "maize_healthy",
    "maize_leaf_beetle",
    "maize_leaf_blight",
    "maize_leaf_spot",
    "maize_streak_virus",
    # 4. Tomato (5 classes)
    "tomato_healthy",
    "tomato_leaf_blight",
    "tomato_leaf_curl",
    "tomato_septoria_leaf_spot",
    "tomato_verticillium_wilt",
]

# Raw folder to class index mapping
FOLDER_TO_CLASS_KEY = {
    # Cashew
    ("cashew", "anthracnose"): "cashew_anthracnose",
    ("cashew", "gumosis"): "cashew_gumosis",
    ("cashew", "healthy"): "cashew_healthy",
    ("cashew", "leaf miner"): "cashew_leaf_miner",
    ("cashew", "red rust"): "cashew_red_rust",
    # Cassava
    ("cassava", "bacterial blight"): "cassava_bacterial_blight",
    ("cassava", "brown spot"): "cassava_brown_spot",
    ("cassava", "green mite"): "cassava_green_mite",
    ("cassava", "healthy"): "cassava_healthy",
    ("cassava", "mosaic"): "cassava_mosaic",
    # Maize
    ("maize", "fall armyworm"): "maize_fall_armyworm",
    ("maize", "grasshoper"): "maize_grasshopper",
    ("maize", "grasshopper"): "maize_grasshopper",
    ("maize", "healthy"): "maize_healthy",
    ("maize", "leaf beetle"): "maize_leaf_beetle",
    ("maize", "leaf blight"): "maize_leaf_blight",
    ("maize", "leaf spot"): "maize_leaf_spot",
    ("maize", "streak virus"): "maize_streak_virus",
    # Tomato
    ("tomato", "healthy"): "tomato_healthy",
    ("tomato", "leaf blight"): "tomato_leaf_blight",
    ("tomato", "leaf curl"): "tomato_leaf_curl",
    ("tomato", "septoria leaf spot"): "tomato_septoria_leaf_spot",
    ("tomato", "verticulium wilt"): "tomato_verticillium_wilt",
    ("tomato", "verticillium wilt"): "tomato_verticillium_wilt",
}

CLASS_METADATA: Dict[str, Dict[str, Any]] = {
    "cashew_anthracnose": {
        "crop": "Cashew",
        "condition": "Anthracnose Blight",
        "pathogen_type": "Fungal",
        "scientific_name": "Colletotrichum gloeosporioides",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Dark necrotic lesions with chlorotic halos expanding on foliage, flowers, and young shoots.",
        "ipm_recommendations": [
            {"action": "IPM Fungicide", "title": "Apply Copper Oxychloride or Mancozeb", "detail": "Spray during flush and flowering at 2-3 week intervals."},
            {"action": "Sanitation", "title": "Prune Infected Twigs", "detail": "Cut and burn infected branches 10cm below lesion margins."}
        ]
    },
    "cashew_gumosis": {
        "crop": "Cashew",
        "condition": "Gummosis Trunk & Branch Canker",
        "pathogen_type": "Fungal",
        "scientific_name": "Lasiodiplodia theobromae",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Amber-colored resinous gum exudates oozing from cracked bark, causing branch dieback.",
        "ipm_recommendations": [
            {"action": "Bark Treatment", "title": "Scrape and Paste Copper Fungicide", "detail": "Scrape oozing cankers and paint with 1% Bordeaux paste."},
            {"action": "Tree Care", "title": "Avoid Mechanical Trunk Wounds", "detail": "Disinfect pruning tools and seal cuts immediately."}
        ]
    },
    "cashew_healthy": {
        "crop": "Cashew",
        "condition": "Healthy Canopy",
        "pathogen_type": "Healthy",
        "scientific_name": "Anacardium occidentale",
        "is_healthy": True,
        "is_pest": False,
        "is_disease": False,
        "urgency": "None",
        "description": "Vibrant green, undamaged foliage with optimal vegetative vigor.",
        "ipm_recommendations": [
            {"action": "Monitoring", "title": "Maintain Routine Monitoring", "detail": "Continue bi-weekly drone or ground scouting for early pest emergence."}
        ]
    },
    "cashew_leaf_miner": {
        "crop": "Cashew",
        "condition": "Cashew Leaf Miner Infestation",
        "pathogen_type": "Pest / Insect",
        "scientific_name": "Acrocercops syngramma",
        "is_healthy": False,
        "is_pest": True,
        "is_disease": False,
        "urgency": "High",
        "description": "Silvery or brown serpentine winding epidermal mines/tunnels on young tender leaves.",
        "ipm_recommendations": [
            {"action": "Bio-Pesticide", "title": "Foliar Spray with Neem Seed Kernel Extract (NSKE 5%)", "detail": "Target new vegetative flushes where moths deposit eggs."},
            {"action": "Chemical Control", "title": "Calibrated Lambda-cyhalothrin / Dimethoate", "detail": "Apply if defoliation exceeds 25% on young flush canopy."}
        ]
    },
    "cashew_red_rust": {
        "crop": "Cashew",
        "condition": "Red Rust Algal Disease",
        "pathogen_type": "Algal / Fungal",
        "scientific_name": "Cephaleuros virescens",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Medium",
        "description": "Orange-red velvety circular pustules on upper leaf surfaces reducing photosynthetic efficiency.",
        "ipm_recommendations": [
            {"action": "Foliar Spray", "title": "Apply Copper Hydroxide (0.2%)", "detail": "Deliver thorough canopy coverage during monsoon humid flushes."},
            {"action": "Canopy Pruning", "title": "Improve Canopy Sunlight Penetration", "detail": "Thin interior dense foliage to reduce microclimate humidity."}
        ]
    },
    "cassava_bacterial_blight": {
        "crop": "Cassava",
        "condition": "Cassava Bacterial Blight (CBB)",
        "pathogen_type": "Bacterial",
        "scientific_name": "Xanthomonas axonopodis pv. manihotis",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Urgent",
        "description": "Angular water-soaked foliar spots, sticky exudates on stems, and sudden wilting dieback.",
        "ipm_recommendations": [
            {"action": "Quarantine & Eradication", "title": "Remove and Destroy Infected Stems", "detail": "Uproot severely wilted plants to prevent rain-splash transmission."},
            {"action": "Clean Material", "title": "Plant Certified Clean Cuttings", "detail": "Use disease-free stem cuttings from certified extension nurseries."}
        ]
    },
    "cassava_brown_spot": {
        "crop": "Cassava",
        "condition": "Cassava Brown Leaf Spot",
        "pathogen_type": "Fungal",
        "scientific_name": "Cercospora henningsii",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Medium",
        "description": "Circular uniform brown leaf spots with distinct dark borders, mainly on older lower foliage.",
        "ipm_recommendations": [
            {"action": "Foliar Fungicide", "title": "Apply Mancozeb or Chlorothalonil", "detail": "Spray if leaf spotting reaches the upper canopy during humid periods."},
            {"action": "Cultural Control", "title": "Increase Plant Spacing for Aeration", "detail": "Maintain 1m x 1m spacing to reduce dense canopy microclimate humidity."}
        ]
    },
    "cassava_green_mite": {
        "crop": "Cassava",
        "condition": "Cassava Green Mite Damage",
        "pathogen_type": "Pest / Insect",
        "scientific_name": "Mononychellus tanajoa",
        "is_healthy": False,
        "is_pest": True,
        "is_disease": False,
        "urgency": "High",
        "description": "Chlorotic yellow pinprick feeding stippling on terminal young leaves with stunted, deformed tips.",
        "ipm_recommendations": [
            {"action": "Biological Control", "title": "Introduce Predatory Mites (Typhlodromalus aripo)", "detail": "Release predatory phytoseiid mites into shoot tips for lasting suppression."},
            {"action": "Organic Spray", "title": "Apply Wetting Sulfur or Soap Emulsion", "detail": "Foliar spray shoot apex during dry season flare-ups."}
        ]
    },
    "cassava_healthy": {
        "crop": "Cassava",
        "condition": "Healthy Foliage",
        "pathogen_type": "Healthy",
        "scientific_name": "Manihot esculenta",
        "is_healthy": True,
        "is_pest": False,
        "is_disease": False,
        "urgency": "None",
        "description": "Dark green palmate leaves with vigorous apical stem growth.",
        "ipm_recommendations": [
            {"action": "Maintenance", "title": "Maintain Standard Agronomic Regimen", "detail": "Ensure timely weeding and balanced N-P-K root tuber fertilization."}
        ]
    },
    "cassava_mosaic": {
        "crop": "Cassava",
        "condition": "Cassava Mosaic Disease (CMD)",
        "pathogen_type": "Viral",
        "scientific_name": "Cassava Mosaic Geminivirus",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Urgent",
        "description": "Severe foliar chlorotic yellow/green mosaic variegation, distorted leaf blades, and stunted growth.",
        "ipm_recommendations": [
            {"action": "Roguing", "title": "Rogue and Burn CMD Infected Plants", "detail": "Eliminate virus reservoirs immediately to halt whitefly transmission."},
            {"action": "Vector Control", "title": "Control Bemisia tabaci Whitefly Vectors", "detail": "Deploy yellow sticky traps and neem oil foliar applications."}
        ]
    },
    "maize_fall_armyworm": {
        "crop": "Maize",
        "condition": "Fall Armyworm Defoliation",
        "pathogen_type": "Pest / Insect",
        "scientific_name": "Spodoptera frugiperda",
        "is_healthy": False,
        "is_pest": True,
        "is_disease": False,
        "urgency": "Urgent",
        "description": "Ragged windowpane foliar feeding holes with abundant sawdust-like frass deep inside the whorl.",
        "ipm_recommendations": [
            {"action": "Bio-Control", "title": "Apply Bacillus thuringiensis (Bt) or Spinosad", "detail": "Deliver bio-pesticide spray directly into the whorl central funnel."},
            {"action": "Trapping", "title": "Deploy Pheromone Traps for Moth Monitoring", "detail": "Place 4-5 pheromone traps per hectare to detect egg-laying peaks."}
        ]
    },
    "maize_grasshopper": {
        "crop": "Maize",
        "condition": "Grasshopper Foliar Feeding",
        "pathogen_type": "Pest / Insect",
        "scientific_name": "Zonocerus variegatus",
        "is_healthy": False,
        "is_pest": True,
        "is_disease": False,
        "urgency": "High",
        "description": "Large irregular chewed leaf margins and defoliated midribs along field edges.",
        "ipm_recommendations": [
            {"action": "Perimeter Spray", "title": "Apply Perimeter Bio-Pesticide Buffer", "detail": "Spray Metarhizium anisopliae or botanical repellents along field borders."},
            {"action": "Physical Control", "title": "Clear Weed Habitats Around Field Edges", "detail": "Mow grassy bunds to eliminate grasshopper breeding zones."}
        ]
    },
    "maize_healthy": {
        "crop": "Maize",
        "condition": "Healthy Canopy",
        "pathogen_type": "Healthy",
        "scientific_name": "Zea mays",
        "is_healthy": True,
        "is_pest": False,
        "is_disease": False,
        "urgency": "None",
        "description": "Broad deep-green leaves with uniform canopy density and optimal vigor.",
        "ipm_recommendations": [
            {"action": "Monitoring", "title": "Maintain Scheduled Scout Missions", "detail": "Track vegetative stage index to optimize side-dress nitrogen timing."}
        ]
    },
    "maize_leaf_beetle": {
        "crop": "Maize",
        "condition": "Maize Flea / Leaf Beetle Feeding",
        "pathogen_type": "Pest / Insect",
        "scientific_name": "Chaetocnema pulicaria",
        "is_healthy": False,
        "is_pest": True,
        "is_disease": False,
        "urgency": "Medium",
        "description": "Fine parallel scraped 'windowpane' epidermal scratches along corn leaf blades.",
        "ipm_recommendations": [
            {"action": "Bio-Insecticide", "title": "Neem Oil Spray (3ml/L)", "detail": "Spray during early morning when adult beetles are active on upper leaves."},
            {"action": "Seed Treatment", "title": "Use Insecticidal Seed Coatings", "detail": "Ensure upcoming seed lots are treated to shield emerging seedlings."}
        ]
    },
    "maize_leaf_blight": {
        "crop": "Maize",
        "condition": "Northern Corn Leaf Blight (NCLB)",
        "pathogen_type": "Fungal",
        "scientific_name": "Exserohilum turcicum",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Large elliptical, cigar-shaped greyish-green to tan lesions parallel to leaf veins.",
        "ipm_recommendations": [
            {"action": "Fungicide", "title": "Apply Azoxystrobin + Difenoconazole", "detail": "Spray prior to tasseling if lesions appear on leaves below the ear leaf."},
            {"action": "Crop Rotation", "title": "Rotate with Non-Gramineous Crops", "detail": "Avoid continuous corn cultivation to exhaust residue-borne fungal inocula."}
        ]
    },
    "maize_leaf_spot": {
        "crop": "Maize",
        "condition": "Gray Leaf Spot (GLS)",
        "pathogen_type": "Fungal",
        "scientific_name": "Cercospora zeae-maydis",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Rectangular, narrow necrotic lesions strictly delimited by leaf veins with yellow borders.",
        "ipm_recommendations": [
            {"action": "Triazole Spray", "title": "Apply Pyraclostrobin or Propiconazole", "detail": "Target canopy at VT-R1 growth stage under high humidity conditions."},
            {"action": "Tillage", "title": "Incorporate Crop Residues into Soil", "detail": "Bury infected debris after harvest to accelerate fungal breakdown."}
        ]
    },
    "maize_streak_virus": {
        "crop": "Maize",
        "condition": "Maize Streak Virus (MSV)",
        "pathogen_type": "Viral",
        "scientific_name": "Maize Streak Mastrevirus",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Continuous, narrow chlorotic white-yellow stripes evenly aligned along leaf veins; plant stunting.",
        "ipm_recommendations": [
            {"action": "Vector Control", "title": "Suppress Cicadulina Leafhopper Vectors", "detail": "Apply systemic seed treatments or foliar sprays against leafhoppers."},
            {"action": "Varietal Resistance", "title": "Sow MSV-Resistant Maize Hybrids", "detail": "Adopt certified MSV-resistant seed lines for next planting cycle."}
        ]
    },
    "tomato_healthy": {
        "crop": "Tomato",
        "condition": "Healthy Foliage",
        "pathogen_type": "Healthy",
        "scientific_name": "Solanum lycopersicum",
        "is_healthy": True,
        "is_pest": False,
        "is_disease": False,
        "urgency": "None",
        "description": "Dark green, turgid leaves with vigorous growth and balanced blossom set.",
        "ipm_recommendations": [
            {"action": "Preventative", "title": "Maintain Balanced Drip Irrigation", "detail": "Avoid wetting foliar canopy to prevent fungal spore germination."}
        ]
    },
    "tomato_leaf_blight": {
        "crop": "Tomato",
        "condition": "Early & Late Blight Complex",
        "pathogen_type": "Fungal / Oomycete",
        "scientific_name": "Alternaria solani / Phytophthora infestans",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Urgent",
        "description": "Concentric dark brown rings on lower leaves expanding rapidly into water-soaked rot.",
        "ipm_recommendations": [
            {"action": "Fungicide Barrier", "title": "Apply Copper Hydroxide / Mancozeb", "detail": "Deliver preventative foliar spray ahead of forecasted rainfall or high humidity."},
            {"action": "Pruning", "title": "Strip Chlorotic Bottom Foliage", "detail": "Remove leaves within 20cm of soil to stop rain-splash spore dissemination."}
        ]
    },
    "tomato_leaf_curl": {
        "crop": "Tomato",
        "condition": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "pathogen_type": "Viral",
        "scientific_name": "Tomato Yellow Leaf Curl Geminivirus",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "Urgent",
        "description": "Upward curling, puckering, vein clearing, severe internode stunting, and blossom drop.",
        "ipm_recommendations": [
            {"action": "Whitefly Control", "title": "Deploy Yellow Sticky Cards & Neem Spray", "detail": "Trap adult whiteflies and spray 2% neem oil emulsion every 7 days."},
            {"action": "Barrier Netting", "title": "Install Insect-Proof Fine Mesh (50-mesh)", "detail": "Enclose nursery seedbeds to shield seedlings from initial vector inoculation."}
        ]
    },
    "tomato_septoria_leaf_spot": {
        "crop": "Tomato",
        "condition": "Septoria Leaf Spot",
        "pathogen_type": "Fungal",
        "scientific_name": "Septoria lycopersici",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Numerous circular pinpoint spots with grey/white centers and dark brown margins across foliage.",
        "ipm_recommendations": [
            {"action": "Protective Spray", "title": "Apply Chlorothalonil / Copper Hydroxide", "detail": "Spray lower canopy as soon as initial spots appear during warm wet weather."},
            {"action": "Mulching", "title": "Apply Organic Straw or Plastic Mulch", "detail": "Shield soil surface to prevent fungal spores from splashing onto foliage."}
        ]
    },
    "tomato_verticillium_wilt": {
        "crop": "Tomato",
        "condition": "Verticillium Vascular Wilt",
        "pathogen_type": "Fungal",
        "scientific_name": "Verticillium dahliae",
        "is_healthy": False,
        "is_pest": False,
        "is_disease": True,
        "urgency": "High",
        "description": "Characteristic V-shaped marginal foliar yellowing and necrosis with brown vascular ring discoloration.",
        "ipm_recommendations": [
            {"action": "Soil Solarization", "title": "Solarize Soil with Transparent Polyethylene", "detail": "Cover moist soil during high-heat months to reduce fungal microsclerotia."},
            {"action": "Rotation", "title": "Rotate with Non-Solanaceous Crops", "detail": "Rotate fields out of tomatoes, potatoes, and eggplants for 3-4 years."}
        ]
    },
}


class CCMTDiseaseClassifier(nn.Module):
    """
    MobileNetV3-based PyTorch deep learning vision model for the CCMT dataset.
    Classifies Cashew, Cassava, Maize, and Tomato pathologies with high efficiency on CPU and GPU.
    """

    def __init__(self, num_classes: int = len(CCMT_CLASSES), pretrained_backbone: bool = True):
        super().__init__()
        self.num_classes = num_classes
        self.classes = CCMT_CLASSES

        if models is not None:
            weights = getattr(models, "MobileNet_V3_Small_Weights", None)
            w_val = weights.DEFAULT if (weights and pretrained_backbone) else None
            self.backbone = models.mobilenet_v3_small(weights=w_val)
            in_features = self.backbone.classifier[0].in_features
            self.backbone.classifier = nn.Sequential(
                nn.Linear(in_features, 512),
                nn.Hardswish(),
                nn.Dropout(p=0.2),
                nn.Linear(512, num_classes),
            )
        else:
            self.backbone = None

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

    def predict_top_k(
        self, x: torch.Tensor, k: int = 3
    ) -> List[Dict[str, Any]]:
        """Returns top-k predicted classes with metadata and probabilities."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probabilities = torch.softmax(logits, dim=-1)[0]
            top_probs, top_indices = torch.topk(probabilities, k=min(k, self.num_classes))

        results = []
        for prob, idx in zip(top_probs.tolist(), top_indices.tolist()):
            class_key = self.classes[idx]
            meta = CLASS_METADATA.get(class_key, {})
            results.append({
                "class_key": class_key,
                "class_index": idx,
                "crop": meta.get("crop", "Unknown"),
                "condition": meta.get("condition", class_key),
                "pathogen_type": meta.get("pathogen_type", "Unknown"),
                "scientific_name": meta.get("scientific_name", ""),
                "probability": round(prob, 4),
                "confidence_percent": round(prob * 100.0, 1),
                "is_healthy": meta.get("is_healthy", False),
                "is_pest": meta.get("is_pest", False),
                "is_disease": meta.get("is_disease", False),
                "urgency": meta.get("urgency", "Medium"),
                "description": meta.get("description", ""),
                "ipm_recommendations": meta.get("ipm_recommendations", []),
            })
        return results
