import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Pill,
  Sprout,
  Droplets,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';

export interface CropRiskData {
  riskPercentage: number;
  threatLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';
  scientificName: string;
  yieldLossRisk: string;
  contagionRate: string;
  interventionUrgency: string;
  recommendations: {
    chemical: { name: string; dosage: string; frequency: string; notes: string }[];
    physical: string[];
  };
  suggestions: {
    irrigation: string;
    sanitation: string;
    resistantCultivars: string;
    scoutingInterval: string;
    environmentalCaution: string;
  };
}

// Complete Agronomic & Pathological Knowledge Base
const CROP_RISK_KNOWLEDGE: Record<string, Record<string, CropRiskData>> = {
  cassava: {
    'Bacterial Blight': {
      riskPercentage: 88,
      threatLevel: 'CRITICAL',
      scientificName: 'Xanthomonas axonopodis pv. manihotis',
      yieldLossRisk: '50% – 75% Canopy Loss',
      contagionRate: 'Rapid (Rain splash & infected pruning shears)',
      interventionUrgency: 'Within 24–48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Copper Oxychloride 50% WP',
            dosage: '2.5 g / Liter of water',
            frequency: 'Spray every 10–12 days during rainy or overcast spells',
            notes: 'Target both upper and lower foliar surfaces thoroughly.',
          },
          {
            name: 'Streptomycin Sulphate (90:10)',
            dosage: '100 ppm (1 g per 10 L water)',
            frequency: 'Tank-mixed with copper fungicide on fresh bacterial lesions',
            notes: 'Prevents systemic vascular bacterial wilting.',
          },
        ],
        physical: [
          'Prune blighted twigs 15–20 cm below the visible water-soaked necrotic lesion.',
          'Sterilize machetes and secateurs in 70% alcohol or 10% sodium hypochlorite bleach.',
          'Rogue and incinerate heavily infected plants outside the plot perimeter.',
        ],
      },
      suggestions: {
        irrigation: 'Transition from overhead sprinkler to drip irrigation immediately to prevent water droplet bacterial splash.',
        sanitation: 'Maintain weed-free field borders; destroy volunteer cassava wild hosts.',
        resistantCultivars: 'Source certified resistant cultivars for next planting cycle: TMS 30572, TME 419, or CR 41-10.',
        scoutingInterval: 'Conduct systematic quadrant scouting every 48 hours for new angular angular water-soaked spots.',
        environmentalCaution: 'Relative humidity > 80% and temperatures between 25°C–30°C accelerate bacterial exudate spread.',
      },
    },
    Mosaic: {
      riskPercentage: 94,
      threatLevel: 'CRITICAL',
      scientificName: 'Cassava Mosaic Begomovirus (CMD)',
      yieldLossRisk: '60% – 90% Storage Root Yield Collapse',
      contagionRate: 'Extreme (Whitefly vector Bemisia tabaci & vegetative stem cuttings)',
      interventionUrgency: 'Immediate (Within 24 Hours)',
      recommendations: {
        chemical: [
          {
            name: 'Acetamiprid 20% SP',
            dosage: '0.25 g / Liter of water',
            frequency: 'Apply early morning when whitefly adults are active on young leaves',
            notes: 'Rotational vector suppression to break virus transmission cycles.',
          },
          {
            name: 'Cold-Pressed Neem Oil (3000 ppm)',
            dosage: '5 ml / Liter with mild surfactant',
            frequency: 'Weekly foliar mist as natural insect antifeedant',
            notes: 'Eco-friendly vector deterrent with zero chemical harvest interval.',
          },
        ],
        physical: [
          'Immediately rogue (uproot) and burn all stunted, mosaic-mottled plants if field incidence < 15%.',
          'Never take propagation cuttings from plants showing leaf blade puckering or yellow mosaic distortion.',
          'Install yellow sticky insect traps (15–20 cards/acre) at canopy level.',
        ],
      },
      suggestions: {
        irrigation: 'Keep plants vigorously growing with balanced drip fertigation to outgrow mild viral stress.',
        sanitation: 'Eradicate wild alternative solanaceous and euphorbia weed hosts around field perimeters.',
        resistantCultivars: 'Adopt verified CMD-resistant planting stock: TMS 98/0505, NASE 14, or TMEB 117.',
        scoutingInterval: 'Scout emerging apical shoots twice weekly; look for characteristic green/yellow mosaic mottling.',
        environmentalCaution: 'Warm dry periods promote whitefly population spikes; step up vector suppression.',
      },
    },
    'Green Mite': {
      riskPercentage: 78,
      threatLevel: 'HIGH',
      scientificName: 'Mononychellus tanajoa',
      yieldLossRisk: '30% – 50% Foliar Defoliation',
      contagionRate: 'High (Wind-borne aerial drift during dry spells)',
      interventionUrgency: 'Within 3–5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Abamectin 1.8% EC',
            dosage: '0.5 ml / Liter of water',
            frequency: 'Spray at first sign of pinprick chlorotic stippling',
            notes: 'Direct high-pressure spray to the undersides of top terminal leaves.',
          },
          {
            name: 'Wettable Sulfur 80% WP',
            dosage: '3.0 g / Liter of water',
            frequency: 'Repeat after 10 days if mite colonies persist',
            notes: 'Provides dual acaricidal and mild powdery mildew control.',
          },
        ],
        physical: [
          'Conserve native predatory phytoseiid mites (Typhlodromalus aripo); avoid broad-spectrum pyrethroids.',
          'Wash apical leaf clusters with water spray early morning to dislodge mite webbing.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid prolonged dry soil stress; apply straw mulching to conserve root-zone moisture.',
        sanitation: 'Intercrop with pigeon pea or cowpea to disrupt continuous mite migration corridors.',
        resistantCultivars: 'Select pubescent leaf cultivars that naturally deter mite feeding and egg deposition.',
        scoutingInterval: 'Inspect top 3–4 terminal leaves weekly for chlorotic pinprick freckling and stunted shoot tips.',
        environmentalCaution: 'Dry hot winds accelerate spider mite reproduction cycles from 14 days down to 8 days.',
      },
    },
    'Brown Spot': {
      riskPercentage: 64,
      threatLevel: 'MODERATE',
      scientificName: 'Passalora henningsii',
      yieldLossRisk: '15% – 30% Premature Lower Leaf Fall',
      contagionRate: 'Moderate (Windborne conidia & splash)',
      interventionUrgency: 'Within 7 Days',
      recommendations: {
        chemical: [
          {
            name: 'Mancozeb 75% WP',
            dosage: '2.0 g / Liter of water',
            frequency: 'Apply at 14-day intervals during wet weather',
            notes: 'Broad-spectrum protective contact fungicide.',
          },
          {
            name: 'Carbendazim 50% WP',
            dosage: '1.0 g / Liter of water',
            frequency: 'Apply as curative systemic spray if spots spread to middle canopy',
            notes: 'Absorbed rapidly into foliar leaf parenchyma.',
          },
        ],
        physical: [
          'Manually remove heavily spotted bottom senescent leaves and compost them deeply away from fields.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain good inter-row drainage; avoid waterlogging around stem collars.',
        sanitation: 'Space cassava stands at 1.0 m x 1.0 m to ensure maximum cross-canopy air circulation.',
        resistantCultivars: 'Choose varieties with upright branching habits that dry quickly after morning dew.',
        scoutingInterval: 'Inspect mature lower canopy leaves every 7–10 days for circular brown necrotic spots.',
        environmentalCaution: 'Extended leaf wetness (> 8 hours) enables fungal conidia germination.',
      },
    },
    Healthy: {
      riskPercentage: 4,
      threatLevel: 'MINIMAL',
      scientificName: 'Manihot esculenta (Vigorous Foliage)',
      yieldLossRisk: '0% Expected Yield Loss',
      contagionRate: 'None Detected',
      interventionUrgency: 'Standard Maintenance',
      recommendations: {
        chemical: [
          {
            name: 'Foliar Micronutrient Blend (Zn + B + Fe)',
            dosage: '1.5 g / Liter of water',
            frequency: 'Apply monthly during peak vegetative canopy expansion',
            notes: 'Boosts photosynthetic efficiency and chlorophyll density.',
          },
        ],
        physical: [
          'Maintain regular weeding and light earthing-up around stem base to support heavy tuber bulking.',
        ],
      },
      suggestions: {
        irrigation: 'Continue balanced weekly irrigation; ensure soil moisture remains at 65%–75% field capacity.',
        sanitation: 'Keep field borders clear of wild weed reservoirs.',
        resistantCultivars: 'Document current seed lot performance for farm-wide expansion.',
        scoutingInterval: 'Perform standard routine bi-weekly field perimeter checks.',
        environmentalCaution: 'Monitor local weather forecasts for sudden unseasonal rainfall or humidity surges.',
      },
    },
  },

  maize: {
    'Fall army worm': {
      riskPercentage: 92,
      threatLevel: 'CRITICAL',
      scientificName: 'Spodoptera frugiperda',
      yieldLossRisk: '40% – 70% Severe Whorl & Ear Destruction',
      contagionRate: 'Rapid (Nocturnal moth egg-laying & larvae migration)',
      interventionUrgency: 'Within 24 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Emamectin Benzoate 5% SG',
            dosage: '0.4 g / Liter of water',
            frequency: 'Direct spray nozzle straight into central plant whorl funnel',
            notes: 'High efficacy against early and mid-instar larvae.',
          },
          {
            name: 'Spinetoram 11.7% SC',
            dosage: '0.5 ml / Liter of water',
            frequency: 'Alternate chemistry after 10 days to manage resistance',
            notes: 'Potent biorational spinosyn insecticide.',
          },
        ],
        physical: [
          'Drop a pinch of dry fine sand or wood ash mixed with neem cake into central leaf whorls.',
          'Install FAW pheromone lure traps (4–5 traps/acre) to monitor moth surge.',
          'Manually crush pinkish-cream egg masses on lower leaf surfaces during early vegetative stage.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid water deficit stress; strong turgid whorls better withstand early pest feeding.',
        sanitation: 'Perform deep summer ploughing to expose overwintering soil pupae to bird predators.',
        resistantCultivars: 'Plant tight-husk hybrid varieties with native resistance to ear penetration.',
        scoutingInterval: 'Scout 20 consecutive plants in 5 field quadrants every 48 hours; look for windowpane holes.',
        environmentalCaution: 'Warm nights (> 20°C) trigger peak adult moth oviposition.',
      },
    },
    'Streak Virus': {
      riskPercentage: 88,
      threatLevel: 'CRITICAL',
      scientificName: 'Maize streak virus (MSV)',
      yieldLossRisk: '45% – 85% Stunting & Barrenness',
      contagionRate: 'High (Transmitted by Leafhopper Cicadulina mbila)',
      interventionUrgency: 'Within 48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Imidacloprid 17.8% SL',
            dosage: '0.3 ml / Liter of water',
            frequency: 'Target leafhopper vector upon first symptom appearance',
            notes: 'Systemic insecticide rapidly absorbed by seedling vascular tissues.',
          },
        ],
        physical: [
          'Rogue out severely stunted seedlings showing continuous chlorotic vein streaks within first 3 weeks.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain optimal nutrition to help mildly affected plants produce marketable ears.',
        sanitation: 'Destroy wild grasses (Digitaria, Eleusine) that harbor leafhopper vector colonies.',
        resistantCultivars: 'Plant MSV-certified resistant hybrids (e.g. SC 403, PAN 53, or local tolerant hybrids).',
        scoutingInterval: 'Scout 10–25 days after germination for narrow translucent vein streaks.',
        environmentalCaution: 'Early-season rainfall followed by sunny breaks triggers vector swarming.',
      },
    },
    'Leaf Blight': {
      riskPercentage: 82,
      threatLevel: 'CRITICAL',
      scientificName: 'Exserohilum turcicum (Northern Corn Leaf Blight)',
      yieldLossRisk: '30% – 55% Premature Canopy Scorch',
      contagionRate: 'Rapid (Wind & rain splash conidia dispersal)',
      interventionUrgency: 'Within 48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
            dosage: '1.0 ml / Liter of water',
            frequency: 'Apply at tasseling stage or first appearance of cigar-shaped lesions',
            notes: 'Broad-spectrum systemic curative and protective strobilurin/triazole.',
          },
          {
            name: 'Mancozeb 75% WP',
            dosage: '2.5 g / Liter of water',
            frequency: 'Protective spray every 10 days in wet overcast conditions',
            notes: 'Contact fungicide with multi-site mode of action.',
          },
        ],
        physical: [
          'Bury or chop crop residues immediately after harvest to disrupt fungal saprophytic survival.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid late-afternoon overhead sprinkler runs that leave leaves damp overnight.',
        sanitation: 'Rotate with non-host legumes (soybean, cowpea, or groundnut) for at least 1 full season.',
        resistantCultivars: 'Select certified NCLB-resistant hybrid corn seeds.',
        scoutingInterval: 'Inspect ear leaf and lower leaves every 3–4 days after tasseling.',
        environmentalCaution: 'Prolonged dew (> 6 hours) and temperatures of 18°C–27°C are optimal for blight sporulation.',
      },
    },
    'Leaf Spot': {
      riskPercentage: 75,
      threatLevel: 'HIGH',
      scientificName: 'Bipolaris maydis (Southern Leaf Blight)',
      yieldLossRisk: '20% – 40% Leaf Area Reduction',
      contagionRate: 'Moderate-High (Airborne spores)',
      interventionUrgency: 'Within 3–5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Propiconazole 25% EC',
            dosage: '1.0 ml / Liter of water',
            frequency: 'Spray at initial onset of rectangular vein-limited tan spots',
            notes: 'Systemic triazole with quick foliar penetration.',
          },
        ],
        physical: [
          'Eliminate lower senescent leaves touching damp soil.',
        ],
      },
      suggestions: {
        irrigation: 'Shift to furrow or drip irrigation.',
        sanitation: 'Deep tillage to bury corn stalk stubble.',
        resistantCultivars: 'Choose normal cytoplasm hybrid corn; avoid Texas male-sterile (T-cms) lines.',
        scoutingInterval: 'Scout mid-canopy leaves weekly.',
        environmentalCaution: 'Thrives in warm, humid weather (25°C–32°C).',
      },
    },
    Grasshopper: {
      riskPercentage: 68,
      threatLevel: 'MODERATE',
      scientificName: 'Hieroglyphus banian / Oedaleus senegalensis',
      yieldLossRisk: '15% – 30% Foliar Defoliation',
      contagionRate: 'Moderate (Migratory swarming)',
      interventionUrgency: 'Within 5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Chlorpyrifos 20% EC',
            dosage: '2.0 ml / Liter of water',
            frequency: 'Spray field borders and grass bunds in the early morning',
            notes: 'Knockdown contact and vapor action on hoppers resting on field bunds.',
          },
        ],
        physical: [
          'Trench field boundaries and dust with 2% methyl parathion or dry ash to trap marching nymphs.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain clean weed-free bunds around corn fields.',
        sanitation: 'Plough field bunds in early winter to crush egg pods buried in soil.',
        resistantCultivars: 'Dense vigorous stands compensate well for minor margin feeding.',
        scoutingInterval: 'Check field margins at dawn when grasshoppers are sluggish.',
        environmentalCaution: 'Dry pre-monsoon spells favor nymph survival.',
      },
    },
    'Leaf Beetle': {
      riskPercentage: 65,
      threatLevel: 'MODERATE',
      scientificName: 'Chaetocnema pulicaria / Oulema melanopus',
      yieldLossRisk: '15% – 25% Shot-hole Leaf Damage',
      contagionRate: 'Moderate',
      interventionUrgency: 'Within 5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Lambda-cyhalothrin 5% EC',
            dosage: '1.0 ml / Liter of water',
            frequency: 'Foliar spray when beetle count exceeds 5 per plant',
            notes: 'Contact pyrethroid with rapid knockdown.',
          },
        ],
        physical: [
          'Conserve ground carabid beetles and spiders.',
        ],
      },
      suggestions: {
        irrigation: 'Promote rapid seedling vigor through starter phosphate fertigation.',
        sanitation: 'Clear wild grassy borders where beetles overwinter.',
        resistantCultivars: 'Plant vigorous early-maturing hybrids.',
        scoutingInterval: 'Check young seedlings at 2–4 leaf stage.',
        environmentalCaution: 'Cool dry spring conditions increase feeding injury.',
      },
    },
    Healthy: {
      riskPercentage: 3,
      threatLevel: 'MINIMAL',
      scientificName: 'Zea mays (Robust Corn Canopy)',
      yieldLossRisk: '0% Expected Yield Loss',
      contagionRate: 'None Detected',
      interventionUrgency: 'Standard Maintenance',
      recommendations: {
        chemical: [
          {
            name: 'Foliar Potassium Nitrate (13-0-45)',
            dosage: '5.0 g / Liter of water',
            frequency: 'Apply during pretassel elongation stage',
            notes: 'Enhances kernel filling and drought tolerance.',
          },
        ],
        physical: [
          'Ensure uniform plant spacing and weed control at knee-high stage.',
        ],
      },
      suggestions: {
        irrigation: 'Ensure critical moisture availability during silking and grain filling.',
        sanitation: 'Maintain weed-free field perimeters.',
        resistantCultivars: 'Document hybrid yield performance.',
        scoutingInterval: 'Weekly routine crop monitoring.',
        environmentalCaution: 'Monitor local weather for heat stress at pollination.',
      },
    },
  },

  tomato: {
    'Leaf Blight': {
      riskPercentage: 88,
      threatLevel: 'CRITICAL',
      scientificName: 'Alternaria solani (Early Blight) / Phytophthora infestans (Late Blight)',
      yieldLossRisk: '50% – 80% Canopy Collapse & Fruit Rot',
      contagionRate: 'Severe (Rapid airborne sporangia & moisture splash)',
      interventionUrgency: 'Within 24–48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Mancozeb 75% WP + Copper Hydroxide 53.8% DF',
            dosage: '2.0 g + 1.5 g / Liter of water',
            frequency: 'Apply immediately; repeat every 7 days in humid weather',
            notes: 'Target concentric target-board lesions and foliar margins.',
          },
          {
            name: 'Dimethomorph 50% WP',
            dosage: '1.0 g / Liter of water',
            frequency: 'Spray if water-soaked greasy lesions appear on upper leaves',
            notes: 'Systemic oomycete inhibitor for aggressive late blight outbreaks.',
          },
        ],
        physical: [
          'Prune lower leaves up to 30 cm from soil surface to break soil splash contact.',
          'Stake and trellis tomato vines to keep foliage off moist beds.',
          'Remove and burn infected fruit and blighted vines outside the field.',
        ],
      },
      suggestions: {
        irrigation: 'Shift exclusively to drip irrigation; never use overhead sprinklers.',
        sanitation: 'Apply black plastic or organic straw mulch across all plant beds.',
        resistantCultivars: 'Choose blight-tolerant cultivars (e.g. Mountain Magic, Defiant, Abhinav).',
        scoutingInterval: 'Inspect lower and mid canopy leaves every 48 hours.',
        environmentalCaution: 'Fog, high humidity (> 90%), and cool nights (15°C–20°C) cause explosive blight spread.',
      },
    },
    'Leaf Curl': {
      riskPercentage: 95,
      threatLevel: 'CRITICAL',
      scientificName: 'Tomato Leaf Curl Virus (ToLCV)',
      yieldLossRisk: '70% – 100% Stunting & Severe Yield Collapse',
      contagionRate: 'Extreme (Transmitted by Whitefly Bemisia tabaci)',
      interventionUrgency: 'Immediate (Within 24 Hours)',
      recommendations: {
        chemical: [
          {
            name: 'Diafenthiuron 50% WP',
            dosage: '1.2 g / Liter of water',
            frequency: 'Apply in the late afternoon directly to undersides of foliage',
            notes: 'Potent whitefly nymph and adult insecticide/acaricide.',
          },
          {
            name: 'Spiromesifen 22.9% SC',
            dosage: '1.0 ml / Liter of water',
            frequency: 'Alternate application after 8 days to suppress vector nymphs',
            notes: 'Lipid biosynthesis inhibitor targeting vector reproduction.',
          },
        ],
        physical: [
          'Erect 40-mesh nylon insect-proof netting over seedling nursery beds.',
          'Install yellow sticky cards (25 cards/acre) throughout the field.',
          'Uproot severely stunted, upward-curling plants during early vegetative phase.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain uniform soil moisture; avoid water stress that attracts whitefly flights.',
        sanitation: 'Plant 2 border rows of maize or sorghum as an insect barrier around tomato plots.',
        resistantCultivars: 'Grow ToLCV-resistant hybrids: US 440, NS 501, or Arka Rakshak.',
        scoutingInterval: 'Inspect apical growth daily for leaf thickening, puckering, and whiteflies.',
        environmentalCaution: 'Hot dry weather spikes whitefly reproduction and dispersal rates.',
      },
    },
    'Septoria Leaf Spot': {
      riskPercentage: 78,
      threatLevel: 'HIGH',
      scientificName: 'Septoria lycopersici',
      yieldLossRisk: '25% – 45% Severe Canopy Defoliation',
      contagionRate: 'High (Rain splash & workers touching wet plants)',
      interventionUrgency: 'Within 3–5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Chlorothalonil 75% WP',
            dosage: '2.0 g / Liter of water',
            frequency: 'Foliar spray every 7–10 days until dry weather returns',
            notes: 'Excellent multi-site protective contact fungicide.',
          },
        ],
        physical: [
          'Remove spotted bottom leaves at first symptom detection.',
          'Never cultivate or harvest tomato vines when leaves are wet with dew.',
        ],
      },
      suggestions: {
        irrigation: 'Use drip lines beneath mulch.',
        sanitation: 'Practice 2 to 3-year crop rotation with non-solanaceous crops.',
        resistantCultivars: 'Choose upright determinate varieties that maintain good canopy airflow.',
        scoutingInterval: 'Inspect lower leaves twice weekly.',
        environmentalCaution: 'Warm temperatures (20°C–25°C) and frequent rainfall trigger rapid lesion sporulation.',
      },
    },
    'Verticillium Wilt': {
      riskPercentage: 84,
      threatLevel: 'CRITICAL',
      scientificName: 'Verticillium dahliae',
      yieldLossRisk: '35% – 60% Premature Vine Decline',
      contagionRate: 'Moderate-High (Soil-borne vascular pathogen)',
      interventionUrgency: 'Within 3 Days',
      recommendations: {
        chemical: [
          {
            name: 'Carbendazim 50% WP or Trichoderma harzianum',
            dosage: '1.0 g / L (chemical) or 5 g / L (bioagent)',
            frequency: 'Root zone soil drench around affected stems',
            notes: 'Suppresses fungal mycelium in the root and vascular rhizosphere.',
          },
        ],
        physical: [
          'Excise dying plants including root ball; do not toss into farm compost.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid over-irrigation that saturates the root zone and weakens vascular defenses.',
        sanitation: 'Solarize soil using clear polyethylene film for 6–8 weeks during summer months.',
        resistantCultivars: 'Plant Verticillium-resistant (V or VF labeled) hybrid seeds.',
        scoutingInterval: 'Look for daytime V-shaped yellowing on lower leaves.',
        environmentalCaution: 'Cooler soil temperatures (20°C–24°C) favor fungal vascular colonization.',
      },
    },
    Healthy: {
      riskPercentage: 4,
      threatLevel: 'MINIMAL',
      scientificName: 'Solanum lycopersicum (Vigorous Tomato Foliage)',
      yieldLossRisk: '0% Expected Yield Loss',
      contagionRate: 'None Detected',
      interventionUrgency: 'Standard Maintenance',
      recommendations: {
        chemical: [
          {
            name: 'Calcium Nitrate + Boron Spray',
            dosage: '2.0 g / Liter of water',
            frequency: 'Bi-weekly spray during flower bloom and fruit set',
            notes: 'Prevents blossom-end rot and strengthens cell wall integrity.',
          },
        ],
        physical: [
          'Continue regular lateral shoot pruning (suckering) and support trellising.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain consistent soil moisture to prevent fruit cracking.',
        sanitation: 'Keep bed mulch intact.',
        resistantCultivars: 'Document vigorous seed performance.',
        scoutingInterval: 'Bi-weekly routine scouting.',
        environmentalCaution: 'Monitor humidity levels inside greenhouse/polyhouse.',
      },
    },
  },

  apple: {
    'Apple Scab': {
      riskPercentage: 86,
      threatLevel: 'CRITICAL',
      scientificName: 'Venturia inaequalis',
      yieldLossRisk: '40% – 70% Fruit Deformity & Premature Leaf Drop',
      contagionRate: 'Rapid (Windborne ascospores during spring rains)',
      interventionUrgency: 'Within 24–48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Myclobutanil 10% WP or Kresoxim-methyl 44.3% SC',
            dosage: '0.5 g / Liter or 0.4 ml / Liter of water',
            frequency: 'Apply immediately; repeat at pink bud and petal fall stages',
            notes: 'Curative triazole/strobilurin stopping fungal haustoria formation.',
          },
          {
            name: 'Captan 50% WP',
            dosage: '2.0 g / Liter of water',
            frequency: 'Protective spray prior to forecasted rain events',
            notes: 'Standard multi-site protective contact orchard fungicide.',
          },
        ],
        physical: [
          'Rake and shred or flail-mow fallen autumn leaves to accelerate fungal pseudothecia decomposition.',
          'Prune inner water sprouts and crowded branches to maximize sunlight penetration and wind drying.',
        ],
      },
      suggestions: {
        irrigation: 'Use micro-sprinklers under canopy; avoid wetting apple tree leaves.',
        sanitation: 'Apply 5% urea spray to orchard floor in late autumn to speed leaf litter breakdown.',
        resistantCultivars: 'Plant scab-immune apple cultivars (e.g. Prima, Liberty, GoldRush).',
        scoutingInterval: 'Inspect young spur leaves every 48 hours following rainy spells in spring.',
        environmentalCaution: 'Mills infection index: 9 hours of continuous leaf wetness at 18°C–24°C guarantees scab infection.',
      },
    },
    'Black Rot': {
      riskPercentage: 92,
      threatLevel: 'CRITICAL',
      scientificName: 'Diplodia seriata / Botryosphaeria obtusa',
      yieldLossRisk: '50% – 80% Fruit Rot & Limb Canker Dieback',
      contagionRate: 'High (Rain-splashed pycnidiospores from twig cankers)',
      interventionUrgency: 'Immediate (Within 24 Hours)',
      recommendations: {
        chemical: [
          {
            name: 'Thiophanate-methyl 70% WP',
            dosage: '1.0 g / Liter of water',
            frequency: 'Apply at petal fall and cover sprays every 14 days',
            notes: 'Broad-spectrum systemic benzimidazole targeting black rot and frog-eye leaf spot.',
          },
        ],
        physical: [
          'Prune dead wood and cankered branches 15 cm below infected tissue during dry dormant season.',
          'Collect and destroy all mummified fruits clinging to branches or fallen on orchard floor.',
        ],
      },
      suggestions: {
        irrigation: 'Maintain balanced tree vigor; drought-stressed or winter-injured trees succumb to cankers.',
        sanitation: 'Disinfect pruning shears with 70% isopropyl alcohol between trees.',
        resistantCultivars: 'Ensure good rootstock compatibility and fire-blight/rot tolerant scions.',
        scoutingInterval: 'Inspect leaves for frog-eye circular lesions with purple borders twice weekly.',
        environmentalCaution: 'Warm summer temperatures (26°C–32°C) coupled with rainfall spur fruit infection.',
      },
    },
    'Cedar Apple Rust': {
      riskPercentage: 74,
      threatLevel: 'HIGH',
      scientificName: 'Gymnosporangium juniperi-virginianae',
      yieldLossRisk: '20% – 40% Leaf Chlorosis & Fruit Blemish',
      contagionRate: 'Moderate (Wind-borne aeciospores from juniper galls)',
      interventionUrgency: 'Within 3–5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Mancozeb 75% WP or Tebuconazole 25.9% EC',
            dosage: '2.0 g / L or 0.8 ml / L of water',
            frequency: 'Apply from tight cluster through second cover spray',
            notes: 'Protects apple leaves during orange gelatinous gall horn extrusion on junipers.',
          },
        ],
        physical: [
          'Eradicate eastern red cedar and juniper alternate host shrubs within a 500-meter radius of the orchard.',
        ],
      },
      suggestions: {
        irrigation: 'Drip lines preferred over overhead irrigation.',
        sanitation: 'Prune gall-bearing branches on ornamental junipers nearby in late winter.',
        resistantCultivars: 'Choose rust-resistant cultivars: Enterprise, Liberty, or Freedom.',
        scoutingInterval: 'Scout upper leaf surfaces in late spring for yellow-orange pycnidial spots.',
        environmentalCaution: 'Spring rains at 12°C–24°C trigger spore ejection from cedar galls.',
      },
    },
    Healthy: {
      riskPercentage: 3,
      threatLevel: 'MINIMAL',
      scientificName: 'Malus domestica (Pristine Foliage & Spurlings)',
      yieldLossRisk: '0% Expected Yield Loss',
      contagionRate: 'None Detected',
      interventionUrgency: 'Standard Maintenance',
      recommendations: {
        chemical: [
          {
            name: 'Foliar Calcium Chloride + Seaweed Extract',
            dosage: '2.5 g / Liter of water',
            frequency: 'Monthly spray from fruitlet stage to harvest',
            notes: 'Strengthens fruit firmness and prevents bitter pit.',
          },
        ],
        physical: [
          'Maintain canopy pruning and weed-free tree strips.',
        ],
      },
      suggestions: {
        irrigation: 'Monitor soil tensiometer readings; maintain 60%–70% available water.',
        sanitation: 'Maintain orchard floor grass mowing.',
        resistantCultivars: 'Document cultivar spur yield.',
        scoutingInterval: 'Routine bi-weekly orchard scouting.',
        environmentalCaution: 'Watch for sudden late spring frosts.',
      },
    },
  },

  cashew: {
    Anthracnose: {
      riskPercentage: 88,
      threatLevel: 'CRITICAL',
      scientificName: 'Colletotrichum gloeosporioides',
      yieldLossRisk: '45% – 70% Inflorescence Blight & Nut Drop',
      contagionRate: 'Severe (Rain splash & wet humid weather conidia)',
      interventionUrgency: 'Within 24–48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Bordeaux Mixture 1% or Copper Oxychloride 50% WP',
            dosage: '2.5 g / Liter of water',
            frequency: 'Spray at fresh vegetative flush, panicle emergence, and fruit set',
            notes: 'Essential protective shield against foliar water-soaked lesions and dieback.',
          },
          {
            name: 'Carbendazim 12% + Mancozeb 63% WP',
            dosage: '1.5 g / Liter of water',
            frequency: 'Apply if reddish-brown necrotic lesions appear on young shoots',
            notes: 'Dual systemic and contact curative action.',
          },
        ],
        physical: [
          'Prune dead dried branches and blighted flower panicles 10 cm into healthy wood.',
          'Burn pruned twigs immediately to destroy overwintering acervuli.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid wetting flowering canopies during morning pollination hours.',
        sanitation: 'Keep inter-tree orchard basin weed-free to lower ambient humidity.',
        resistantCultivars: 'Plant high-yielding anthracnose-tolerant cashew clones (e.g. VRI-3, BPP-8, Ullal-4).',
        scoutingInterval: 'Inspect new vegetative flushes and tender panicles twice weekly.',
        environmentalCaution: 'Relative humidity > 85% with temperatures 26°C–30°C triggers blossom blight.',
      },
    },
    Gummosis: {
      riskPercentage: 82,
      threatLevel: 'CRITICAL',
      scientificName: 'Lasiodiplodia theobromae',
      yieldLossRisk: '35% – 65% Branch Dieback & Tree Death',
      contagionRate: 'High (Soil & airborne conidia entering through bark wounds)',
      interventionUrgency: 'Within 48 Hours',
      recommendations: {
        chemical: [
          {
            name: 'Bordeaux Paste (1:1:10) on Scraped Trunk',
            dosage: 'Apply thick paste over cleaned bark wound',
            frequency: 'Apply after scraping gummy bark exudate down to healthy green wood',
            notes: 'Seals vascular tissue and eradicates fungal hyphae.',
          },
          {
            name: 'Metalaxyl 8% + Mancozeb 64% WP',
            dosage: '2.5 g / Liter of water',
            frequency: 'Drench root zone and collar region (5–10 L per tree)',
            notes: 'Systemic oomycete and canker protection.',
          },
        ],
        physical: [
          'Carefully chisel away diseased dark bark displaying gummy amber exudate.',
          'Avoid mechanical injuries from tractor or weeding implements to lower trunk.',
        ],
      },
      suggestions: {
        irrigation: 'Improve soil sub-surface drainage; avoid stagnant water around tree collars.',
        sanitation: 'Paint lower trunk up to 1 meter with lime wash + copper oxychloride.',
        resistantCultivars: 'Propagate from grafted rootstocks tolerant to collar infections.',
        scoutingInterval: 'Inspect tree trunks and main scaffold forks monthly for gummy weeping.',
        environmentalCaution: 'Waterlogged soils and stem borer tunnels exacerbate gummosis severity.',
      },
    },
    'Leaf Miner': {
      riskPercentage: 72,
      threatLevel: 'HIGH',
      scientificName: 'Acrocercops syngramma',
      yieldLossRisk: '20% – 40% Young Foliar Flush Loss',
      contagionRate: 'High (Micro-moth egg laying on tender leaves)',
      interventionUrgency: 'Within 3–5 Days',
      recommendations: {
        chemical: [
          {
            name: 'Profenofos 50% EC',
            dosage: '1.5 ml / Liter of water',
            frequency: 'Spray during initial flush emergence when silvery serpentine mines appear',
            notes: 'Translaminar penetration reaches larvae feeding within epidermal leaf layers.',
          },
          {
            name: 'Neem Seed Kernel Extract (NSKE 5%)',
            dosage: '50 g / Liter of water',
            frequency: 'Spray at 10-day intervals during tender flush phase',
            notes: 'Deters ovipositing adult micro-moths naturally.',
          },
        ],
        physical: [
          'Hand-pick and crush mined leaves in small high-density young orchards.',
        ],
      },
      suggestions: {
        irrigation: 'Synchronize flush emergence with uniform irrigation scheduling.',
        sanitation: 'Maintain clean weed-free understory.',
        resistantCultivars: 'Choose varieties with rapid leaf cuticle hardening.',
        scoutingInterval: 'Scout tender pinkish-bronze new flush leaves twice weekly.',
        environmentalCaution: 'Peak damage occurs in post-monsoon flush window (September to December).',
      },
    },
    'Red Rust': {
      riskPercentage: 62,
      threatLevel: 'MODERATE',
      scientificName: 'Cephaleuros virescens (Parasitic Alga)',
      yieldLossRisk: '15% – 30% Foliar Photosynthetic Reduction',
      contagionRate: 'Moderate (Wind & rain splash algal zoospores)',
      interventionUrgency: 'Within 7 Days',
      recommendations: {
        chemical: [
          {
            name: 'Copper Oxychloride 50% WP',
            dosage: '2.5 g / Liter of water',
            frequency: 'Apply thoroughly to upper leaf surfaces bearing velvety rust patches',
            notes: 'Effective algaecide suppressing zoospore release.',
          },
        ],
        physical: [
          'Prune interlocking branches to allow sunlight penetration into inner shaded canopy.',
        ],
      },
      suggestions: {
        irrigation: 'Avoid continuous damp shade under dense unpruned tree groves.',
        sanitation: 'Correct soil acidity by applying agricultural lime (Dolomite) as per soil test.',
        resistantCultivars: 'Ensure standard 7.5m x 7.5m or 8m x 8m tree spacing.',
        scoutingInterval: 'Inspect older leathery leaves monthly for circular brick-red velvety cushions.',
        environmentalCaution: 'Shaded, high-humidity orchards with poor air drainage promote algal growth.',
      },
    },
    Healthy: {
      riskPercentage: 4,
      threatLevel: 'MINIMAL',
      scientificName: 'Anacardium occidentale (Healthy Foliage & Panicles)',
      yieldLossRisk: '0% Expected Yield Loss',
      contagionRate: 'None Detected',
      interventionUrgency: 'Standard Maintenance',
      recommendations: {
        chemical: [
          {
            name: 'Micronutrient Spray (Zinc 0.5% + Boron 0.1%)',
            dosage: '2.0 g / Liter of water',
            frequency: 'Spray at panicle initiation',
            notes: 'Enhances hermaphrodite flower ratio and nut set percentage.',
          },
        ],
        physical: [
          'Maintain clean weed basin and remove water sprouts.',
        ],
      },
      suggestions: {
        irrigation: 'Apply protective irrigation during flowering and nut development.',
        sanitation: 'Maintain clear tree basins.',
        resistantCultivars: 'Propagate verified high-yielding grafts.',
        scoutingInterval: 'Bi-weekly routine tree inspections.',
        environmentalCaution: 'Watch for unseasonal rain during nut maturation.',
      },
    },
  },
};

interface Props {
  selectedCrop: string;
  prediction?: string;
  confidence?: number;
  isYolo?: boolean;
  yoloSeverityPct?: number;
  yoloLesionCount?: number;
  onQuickSampleClick?: (sampleName: string) => void;
}

export const CropRiskAdvisoryPanel: React.FC<Props> = ({
  selectedCrop,
  prediction,
  confidence,
  isYolo,
  yoloSeverityPct,
  yoloLesionCount,
  onQuickSampleClick,
}) => {
  const [activeTab, setActiveTab] = useState<'recoment' | 'suggesention'>('recoment');

  // Determine current crop risk profile
  const cropKey = selectedCrop.toLowerCase();
  const cropData = CROP_RISK_KNOWLEDGE[cropKey] || CROP_RISK_KNOWLEDGE['cassava'];

  // If we have an active prediction
  const activeProfile: CropRiskData | undefined = prediction
    ? cropData[prediction] || (prediction.toLowerCase().includes('healthy') ? cropData['Healthy'] : Object.values(cropData)[0])
    : undefined;

  // If YOLO mode, compute dynamic risk percentage
  let dynamicRiskPct = activeProfile ? activeProfile.riskPercentage : 0;
  let dynamicThreatLevel = activeProfile ? activeProfile.threatLevel : 'CRITICAL';

  if (isYolo && yoloSeverityPct !== undefined) {
    if (yoloSeverityPct > 20 || (yoloLesionCount && yoloLesionCount > 10)) {
      dynamicRiskPct = Math.min(98, Math.round(75 + yoloSeverityPct * 0.8));
      dynamicThreatLevel = 'CRITICAL';
    } else if (yoloSeverityPct > 8) {
      dynamicRiskPct = Math.round(50 + yoloSeverityPct * 1.5);
      dynamicThreatLevel = 'HIGH';
    } else if (yoloSeverityPct > 2) {
      dynamicRiskPct = Math.round(25 + yoloSeverityPct * 3);
      dynamicThreatLevel = 'MODERATE';
    } else {
      dynamicRiskPct = 5;
      dynamicThreatLevel = 'MINIMAL';
    }
  }

  const isHealthy = prediction ? prediction.toLowerCase().includes('healthy') : false;

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 1: Awaiting Scan / Idle State (Renders in the user's screenshot RED box area!)
  // ──────────────────────────────────────────────────────────────────────────
  if (!prediction && !isYolo) {
    // List top 3 disease threats for this crop with their red risk percentages
    const threatList = Object.entries(cropData).filter(([key]) => key !== 'Healthy').slice(0, 3);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {selectedCrop.toUpperCase()} Pathogen Threat Watchlist
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Baseline epidemiological risk tiers for current foliage
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Standby
          </span>
        </div>

        {/* Threat List Cards */}
        <div className="flex flex-col gap-2">
          {threatList.map(([name, data]) => (
            <div
              key={name}
              onClick={() => onQuickSampleClick && onQuickSampleClick(name)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-rose-500/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                    {name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    {data.scientificName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {data.riskPercentage}% Risk
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition" />
              </div>
            </div>
          ))}
        </div>

        {/* Readiness Checklist */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Diagnostics Readiness
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 leading-relaxed">
            Aim camera directly at symptomatic foliage lesions or click any dataset sample above. The neural engine will immediately compute the <strong>Red Risk Percentage</strong>, <strong>Chemical Dosage Recommendations</strong>, and <strong>Agronomic Suggestions</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CASE 2: Active Analysis Results (When an image has been analyzed!)
  // ──────────────────────────────────────────────────────────────────────────
  const profile = activeProfile || Object.values(cropData)[0];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-5">
      {/* ── 1. PROMINENT RED RISK PERCENTAGE BANNER ── */}
      <div
        className={`p-4 rounded-2xl border ${
          isHealthy
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-100'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isHealthy
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
              }`}
            >
              {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pathological Severity & Threat Assessment
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                <span>{prediction || 'Foliar Lesion Analysis'}</span>
                {confidence !== undefined && (
                  <span className="text-[10px] text-slate-400 font-normal">({confidence}% conf)</span>
                )}
                {!isHealthy && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                    {dynamicThreatLevel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RED RISK PERCENTAGE BADGE */}
          <div className="text-right">
            <div
              className={`text-3xl font-black tracking-tight ${
                isHealthy
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-500 drop-shadow-sm'
              }`}
            >
              {dynamicRiskPct}%
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isHealthy
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              Risk Factor
            </span>
          </div>
        </div>

        {/* Dynamic Risk Meter */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden mt-3 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isHealthy
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, dynamicRiskPct))}%` }}
          />
        </div>

        {/* 3 Metric Badges */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Yield Impact</span>
            <span
              className={`text-xs font-black ${
                isHealthy ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {profile.yieldLossRisk.split(' ')[0]} Loss
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Spread Risk</span>
            <span
              className={`text-xs font-black ${
                isHealthy ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {profile.contagionRate.split(' ')[0]}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Action Window</span>
            <span
              className={`text-xs font-black ${
                isHealthy ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {profile.interventionUrgency.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. TAB CONTROLS FOR RECOMMENDATIONS & SUGGESTIONS ── */}
      <div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
          <button
            onClick={() => setActiveTab('recoment')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'recoment'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            Chemical & Bio Treatments
          </button>
          <button
            onClick={() => setActiveTab('suggesention')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'suggesention'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            Agronomic Suggestions
          </button>
        </div>

        {/* ── TAB CONTENT: RECOMMENDATIONS ("recoment") ── */}
        {activeTab === 'recoment' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-rose-500" />
                Targeted Chemical & Bio-Fungicide Recommendations
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Exact Field Dosages</span>
            </div>

            {profile.recommendations.chemical.map((chem, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                    {chem.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {chem.dosage}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  <strong>Frequency:</strong> {chem.frequency}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Note: {chem.notes}
                </div>
              </div>
            ))}

            {/* Physical Eradication Steps */}
            {profile.recommendations.physical.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Mandatory Mechanical / Physical Steps
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90">
                  {profile.recommendations.physical.map((phy, idx) => (
                    <li key={idx}>{phy}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: SUGGESTIONS ("suggesention") ── */}
        {activeTab === 'suggesention' && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5">
              <Droplets className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block text-[11px] uppercase">
                  Irrigation Protocol:
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {profile.suggestions.irrigation}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5">
              <Sprout className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block text-[11px] uppercase">
                  Recommended Resistant Cultivars:
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {profile.suggestions.resistantCultivars}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block text-[11px] uppercase">
                  Field Scouting Interval:
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {profile.suggestions.scoutingInterval}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5">
              <Thermometer className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100 block text-[11px] uppercase">
                  Microclimate Caution:
                </strong>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {profile.suggestions.environmentalCaution}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
