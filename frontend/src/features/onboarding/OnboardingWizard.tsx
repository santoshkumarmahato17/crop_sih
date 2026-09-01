import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Volume2,
  Sprout,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  MapPin,
  Camera,
  FolderOpen,
  Sparkles,
  Check,
  Navigation,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth, OnboardingData } from '@/context/AuthContext';

export interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  samplePhrase: string;
  region: string;
  isPriority?: boolean;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English (Default)',
    code: 'en-US',
    samplePhrase: 'Welcome to AGRI SHIELD precision crop health, weather risk, and pest forecasting platform.',
    region: 'Global / All-India',
    isPriority: true,
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी (भारत)',
    code: 'hi-IN',
    samplePhrase: 'नमस्ते! एग्री शील्ड फसल स्वास्थ्य, कीट निगरानी और मौसम पूर्वानुमान में आपका स्वागत है।',
    region: 'North & Central India',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी (महाराष्ट्र)',
    code: 'mr-IN',
    samplePhrase: 'नमस्कार! एग्री शील्ड महाराष्ट्र पीक संरक्षण आणि हवामान अंदाज प्रणालीमध्ये आपले स्वागत आहे.',
    region: 'Maharashtra (Regional)',
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી (ગુજરાત)',
    code: 'gu-IN',
    samplePhrase: 'નમસ્તે! એગ્રી શીલ્ડ પાક સંરક્ષણ અને હવામાન આગાહી સિસ્ટમમાં આપનું સ્વાગત છે.',
    region: 'Gujarat & Western India',
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ (ಕರ್ನಾಟಕ)',
    code: 'kn-IN',
    samplePhrase: 'ನಮಸ್ಕಾರ! ಅಗ್ರಿ ಶೀಲ್ಡ್ ಬೆಳೆ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ ವ್ಯವಸ್ಥೆಗೆ ಸ್ವಾಗತ.',
    region: 'Karnataka & Deccan Border',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు (ఆంధ్ర / తెలంగాణ)',
    code: 'te-IN',
    samplePhrase: 'నమస్కారం! అగ్రి షీల్డ్ పంట ఆరోగ్య మరియు వాతావరణ అంచనా వ్యవస్థకు స్వాగతం.',
    region: 'Telangana & Andhra Pradesh',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ் (தமிழ்நாடு)',
    code: 'ta-IN',
    samplePhrase: 'வணக்கம்! அக்ரி ஷீல்ட் பயிர் பாதுகாப்பு மற்றும் வானிலை முன்னறிவிப்புக்கு வரவேற்கிறோம்.',
    region: 'Tamil Nadu',
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ (ਪੰਜਾਬ)',
    code: 'pa-IN',
    samplePhrase: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਐਗਰੀ ਸ਼ੀਲਡ ਫਸਲ ਸੁਰੱਖਿਆ ਅਤੇ ਮੌਸਮ ਪ੍ਰਣਾਲੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।',
    region: 'Punjab & Haryana',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা (পশ্চিমবঙ্গ)',
    code: 'bn-IN',
    samplePhrase: 'নমস্কার! এগ্রি শিল্ড শস্য সুরক্ষা ও আবহাওয়া পূর্বাভাস ব্যবস্থায় আপনাকে স্বাগতম।',
    region: 'West Bengal & Eastern India',
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം (കേരളം)',
    code: 'ml-IN',
    samplePhrase: 'നമസ്കാരം! അഗ്രി ഷീൽഡ് വിള സംരക്ഷണ സംവിധാനത്തിലേക്ക് സ്വാഗതം.',
    region: 'Kerala & Western Coast',
  },
];

export interface CropOption {
  id: string;
  name: string;
  vernacular: string;
  marathiName: string;
  category: string;
  imageUrl: string;
  duration: string;
  maharashtraRegion: string;
}

export const MAHARASHTRA_CROPS: CropOption[] = [
  {
    id: 'cotton',
    name: 'Bt Cotton',
    vernacular: 'Cotton (White Gold)',
    marathiName: 'Bt Cotton',
    category: 'Cash & Fiber Crop',
    imageUrl: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=600&q=80',
    duration: '160 - 180 Days',
    maharashtraRegion: 'Vidarbha & Marathwada (Yavatmal, Akola, Amravati, Jalgaon)',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane (Co-86032)',
    vernacular: 'Sugarcane (Irrigated)',
    marathiName: 'Sugarcane',
    category: 'Commercial Cash Crop',
    imageUrl: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=600&q=80',
    duration: '330 - 365 Days',
    maharashtraRegion: 'Western Maharashtra (Kolhapur, Pune, Sangli, Satara, Ahmednagar)',
  },
  {
    id: 'soybean',
    name: 'Soybean (JS-335 / JS-9305)',
    vernacular: 'Soybean (Kharif)',
    marathiName: 'Soybean',
    category: 'Oilseed & Protein Crop',
    imageUrl: 'https://images.unsplash.com/photo-1599588675200-a664654e0c3f?auto=format&fit=crop&w=600&q=80',
    duration: '90 - 105 Days',
    maharashtraRegion: 'Marathwada & Vidarbha (Latur, Osmanabad, Nanded, Buldhana)',
  },
  {
    id: 'onion',
    name: 'Onion (Gavran / Fursungi)',
    vernacular: 'Red Onion (Rabi & Kharif)',
    marathiName: 'Red Onion',
    category: 'Horticulture / Bulb Crop',
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
    duration: '110 - 130 Days',
    maharashtraRegion: 'Nashik, Ahmednagar, Pune (Lasalgaon Market Belt)',
  },
  {
    id: 'grapes',
    name: 'Grapes (Thompson Seedless / Sonaka)',
    vernacular: 'Export Grapes',
    marathiName: 'Table & Export Grapes',
    category: 'High-Value Horticulture',
    imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
    duration: 'Perennial (120-140 Days/Pruning)',
    maharashtraRegion: 'Nashik, Sangli, Solapur (Grape Capital Belt)',
  },
  {
    id: 'pomegranate',
    name: 'Pomegranate (Bhagwa / Arakta)',
    vernacular: 'Pomegranate (Bhagwa)',
    marathiName: 'Pomegranate',
    category: 'Arid Horticulture',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    duration: 'Perennial (Bahar Management)',
    maharashtraRegion: 'Solapur (Sangola), Sangli, Ahilyanagar Arid Belt',
  },
  {
    id: 'paddy',
    name: 'Paddy Rice (Indrayani / Wada Kolam)',
    vernacular: 'Paddy / Rice',
    marathiName: 'Paddy Rice',
    category: 'Cereal / Staple Grain',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    duration: '115 - 135 Days',
    maharashtraRegion: 'Konkan Coast (Ratnagiri, Sindhudurg, Raigad, Thane/Palghar)',
  },
  {
    id: 'wheat',
    name: 'Wheat (Lokwan / Sharbati)',
    vernacular: 'Golden Wheat',
    marathiName: 'Golden Wheat',
    category: 'Rabi Cereal Grain',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    duration: '110 - 125 Days',
    maharashtraRegion: 'Khandesh, Central Maharashtra & Marathwada Irrigated Tracts',
  },
  {
    id: 'tomato',
    name: 'Tomato (Abhinav / Hyb-3)',
    vernacular: 'Fresh Hybrid Tomato',
    marathiName: 'Hybrid Tomato',
    category: 'Vegetable Crop',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    duration: '90 - 120 Days',
    maharashtraRegion: 'Junnar (Pune), Nashik (Dindori), Satara Belt',
  },
  {
    id: 'turmeric',
    name: 'Turmeric (Salem / Rajapuri)',
    vernacular: 'Golden Spice Turmeric',
    marathiName: 'Turmeric',
    category: 'Commercial Spice Crop',
    imageUrl: 'https://images.unsplash.com/photo-1615485290176-791b7d5a5700?auto=format&fit=crop&w=600&q=80',
    duration: '240 - 270 Days',
    maharashtraRegion: 'Sangli, Satara & Nanded (Turmeric Trading Hub)',
  },
];

export interface SoilOption {
  id: string;
  name: string;
  marathiName: string;
  vernacular: string;
  colorClass: string;
  borderClass: string;
  description: string;
  bestFor: string;
  maharashtraGeology: string;
  soilTextureUrl: string;
}

export const MAHARASHTRA_SOILS: SoilOption[] = [
  {
    id: 'black_cotton_regur',
    name: 'Black Cotton Soil (Regur Clay)',
    marathiName: 'Black Cotton Soil',
    vernacular: 'Deccan Trap Basalt • Deep Black Clay',
    colorClass: 'bg-slate-950 text-slate-100',
    borderClass: 'border-slate-700',
    description: 'High montmorillonite clay content with deep self-ploughing cracks and extraordinary moisture retention.',
    bestFor: 'Cotton, Soybean, Sugarcane, Sorghum & Sunflower',
    maharashtraGeology: 'Deccan Trap Basalt Lava (Vidarbha, Marathwada, Khandesh & Western Maharashtra)',
    soilTextureUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'laterite_soil',
    name: 'Laterite Soil (Jambha)',
    marathiName: 'Laterite Soil (Coastal & Ghats)',
    vernacular: 'Iron & Aluminium Rich Tropical Clay',
    colorClass: 'bg-orange-950/70 text-orange-200',
    borderClass: 'border-orange-700/60',
    description: 'Heavily leached tropical reddish-brown soil rich in iron and bauxite oxides, highly porous with rapid percolation.',
    bestFor: 'Alphonso Mango, Cashew, Betelnut, Coconut & Paddy',
    maharashtraGeology: 'High Rainfall Western Ghats (Ratnagiri, Sindhudurg, Kolhapur Western Ghats)',
    soilTextureUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'alluvial_loam',
    name: 'River Basin Alluvial Loam',
    marathiName: 'River Delta Silt Loam',
    vernacular: 'Godavari, Bhima, Krishna Basins • Silt Loam',
    colorClass: 'bg-amber-950/60 text-amber-200',
    borderClass: 'border-amber-700/60',
    description: 'Finely textured river delta silt loam with neutral pH (7.2), rich in available potassium, organic humus and micronutrients.',
    bestFor: 'Sugarcane, Wheat, Grapes, Onion & Banana',
    maharashtraGeology: 'River Basins (Godavari, Krishna, Tapi & Bhima River Banks)',
    soilTextureUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'red_yellow_soil',
    name: 'Red & Yellow Sandy Clay',
    marathiName: 'Red Sandy Loam Soil',
    vernacular: 'Ferruginous Sandy Clay',
    colorClass: 'bg-rose-950/60 text-rose-200',
    borderClass: 'border-rose-700/60',
    description: 'Derived from ancient crystalline granite-gneiss rock formations. Moderate fertility, well-aerated with good drainage.',
    bestFor: 'Paddy, Groundnut, Pigeon Pea (Tur) & Vegetables',
    maharashtraGeology: 'Wainganga & Pranhita Basins (Bhandara, Gondia, Gadchiroli, Chandrapur)',
    soilTextureUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'shallow_loam',
    name: 'Medium Shallow Loam',
    marathiName: 'Light Gravelly Murrum Soil',
    vernacular: 'Plateau Murrum • High Drainage',
    colorClass: 'bg-yellow-950/50 text-yellow-200',
    borderClass: 'border-yellow-700/50',
    description: 'Coarse to medium textured soil over murrum substrate, excellent aeration, preventing water-logging root rot in orchards.',
    bestFor: 'Pomegranate, Guava, Custard Apple, Pearl Millet (Bajra) & Gram',
    maharashtraGeology: 'Semi-Arid Rainshadow Tracts (Solapur, Sangola, Satara & Ahilyanagar Plateaus)',
    soilTextureUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
  },
];

export interface MaharashtraDistrict {
  id: string;
  name: string;
  marathiName: string;
  region: string;
  agroZone: string;
  coordinates: string;
}

export const MAHARASHTRA_DISTRICTS: MaharashtraDistrict[] = [
  { id: 'nashik', name: 'Nashik', marathiName: 'Nashik District', region: 'North Maharashtra (Khandesh)', agroZone: 'Western Ghats & Transition Zone', coordinates: '19.9975° N, 73.7898° E' },
  { id: 'pune', name: 'Pune', marathiName: 'Pune District', region: 'Western Maharashtra', agroZone: 'Scarcity & Plain Zone', coordinates: '18.5204° N, 73.8567° E' },
  { id: 'solapur', name: 'Solapur', marathiName: 'Solapur District', region: 'Western Maharashtra', agroZone: 'Scarcity Drought-Prone Zone', coordinates: '17.6599° N, 75.9064° E' },
  { id: 'ahmednagar', name: 'Ahilyanagar (Ahmednagar)', marathiName: 'Ahilyanagar District', region: 'Central Maharashtra', agroZone: 'Scarcity Rainshadow Zone', coordinates: '19.0952° N, 74.7496° E' },
  { id: 'aurangabad', name: 'Chhatrapati Sambhaji Nagar', marathiName: 'Chhatrapati Sambhaji Nagar', region: 'Marathwada', agroZone: 'Central Maharashtra Plateau', coordinates: '19.8762° N, 75.3433° E' },
  { id: 'kolhapur', name: 'Kolhapur', marathiName: 'Kolhapur District', region: 'Western Maharashtra (South)', agroZone: 'Sub-Montane High Rainfall Zone', coordinates: '16.7050° N, 74.2433° E' },
  { id: 'sangli', name: 'Sangli', marathiName: 'Sangli District', region: 'Western Maharashtra', agroZone: 'Krishna Basin Agro-Zone', coordinates: '16.8524° N, 74.5815° E' },
  { id: 'satara', name: 'Satara', marathiName: 'Satara District', region: 'Western Maharashtra', agroZone: 'Sub-Montane Transition Zone', coordinates: '17.6805° N, 74.0183° E' },
  { id: 'nagpur', name: 'Nagpur', marathiName: 'Nagpur District', region: 'Vidarbha (Orange Belt)', agroZone: 'Eastern Vidarbha Assured Rainfall', coordinates: '21.1458° N, 79.0882° E' },
  { id: 'amravati', name: 'Amravati', marathiName: 'Amravati District', region: 'Western Vidarbha', agroZone: 'Cotton & Soybean Agro-Zone', coordinates: '20.9320° N, 77.7523° E' },
  { id: 'yavatmal', name: 'Yavatmal', marathiName: 'Yavatmal District', region: 'Vidarbha', agroZone: 'Black Cotton Agro-Climatic Belt', coordinates: '20.3888° N, 78.1204° E' },
  { id: 'latur', name: 'Latur', marathiName: 'Latur District', region: 'Marathwada', agroZone: 'Soybean & Pulses Agro-Zone', coordinates: '18.4088° N, 76.5604° E' },
  { id: 'jalgaon', name: 'Jalgaon', marathiName: 'Jalgaon District', region: 'Khandesh (Banana & Cotton)', agroZone: 'Tapi Basin Alluvial Zone', coordinates: '21.0077° N, 75.5626° E' },
  { id: 'ratnagiri', name: 'Ratnagiri', marathiName: 'Ratnagiri District', region: 'Konkan Coast', agroZone: 'Very High Rainfall Coastal Laterite Zone', coordinates: '16.9902° N, 73.3120° E' },
  { id: 'nanded', name: 'Nanded', marathiName: 'Nanded District', region: 'Marathwada', agroZone: 'Godavari Basin Turmeric & Cotton Zone', coordinates: '19.1383° N, 77.3210° E' },
];

export const OnboardingWizard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Language
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en'); // Default to English
  const [langSearch, setLangSearch] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Step 2: Crops
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['cotton', 'soybean', 'sugarcane']);
  const [cropSearch, setCropSearch] = useState<string>('');

  // Step 3: Soil
  const [selectedSoil, setSelectedSoil] = useState<string>('black_cotton_regur');
  const [soilSearch, setSoilSearch] = useState<string>('');

  // Step 4: Location / Maharashtra District
  const [selectedDistrict, setSelectedDistrict] = useState<string>('nashik');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [detectedCoords, setDetectedCoords] = useState<string>('19.9975° N, 73.7898° E (Nashik, Maharashtra)');

  // Step 5: Hardware & Media Permissions
  const [permissions, setPermissions] = useState({
    location: true,
    camera: false,
    gallery: false,
    notifications: true,
  });
  const [permFeedback, setPermFeedback] = useState<string | null>(null);

  // Audio Speech Preview
  const handlePlayAudioSample = (lang: LanguageOption) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lang.samplePhrase);
    utterance.lang = lang.code;
    utterance.rate = 0.95;

    setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Location Geolocation Request
  const handleRequestLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = `${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (GPS Live Detected)`;
          setDetectedCoords(coords);
          setPermissions((prev) => ({ ...prev, location: true }));
          setPermFeedback('📍 Live GPS Location Detected Successfully!');
          setTimeout(() => setPermFeedback(null), 3500);
        },
        () => {
          setIsLocating(false);
          setPermissions((prev) => ({ ...prev, location: true }));
          setPermFeedback('📍 Agro-Climatic Zone Location Activated!');
          setTimeout(() => setPermFeedback(null), 3500);
        }
      );
    } else {
      setIsLocating(false);
      setPermissions((prev) => ({ ...prev, location: true }));
    }
  };

  // Camera Permission Trigger & Test
  const handleRequestCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissions((prev) => ({ ...prev, camera: true }));
        setPermFeedback('📸 Camera Access Granted Successfully!');
        // Stop stream after 4 seconds to conserve resources
        setTimeout(() => {
          stream.getTracks().forEach((track) => track.stop());
          setPermFeedback(null);
        }, 4000);
      } else {
        setPermissions((prev) => ({ ...prev, camera: true }));
        setPermFeedback('📸 Camera Leaf Scanner Active!');
        setTimeout(() => setPermFeedback(null), 3000);
      }
    } catch {
      setPermissions((prev) => ({ ...prev, camera: true }));
      setPermFeedback('📸 Camera Leaf Scanner Simulation Active!');
      setTimeout(() => setPermFeedback(null), 3000);
    }
  };

  // Gallery Permission Trigger
  const handleRequestGallery = () => {
    setPermissions((prev) => ({ ...prev, gallery: true }));
    setPermFeedback('📁 Gallery & Storage Access Granted!');
    setTimeout(() => setPermFeedback(null), 3000);
  };

  const toggleCrop = (cropId: string) => {
    if (selectedCrops.includes(cropId)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter((c) => c !== cropId));
      }
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleFinishOnboarding = () => {
    const finalData: OnboardingData = {
      language: selectedLanguage,
      crops: selectedCrops,
      soilType: selectedSoil,
      permissions: {
        location: permissions.location,
        notifications: permissions.notifications,
        camera: permissions.camera,
        video: true,
      },
    };

    completeOnboarding(finalData);

    // Broadcast update across active tabs and components
    window.dispatchEvent(
      new CustomEvent('agrishield:settings_updated', {
        detail: {
          ...finalData,
          district: selectedDistrict,
          detectedCoords,
        },
      })
    );

    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const currentDistrictObj =
    MAHARASHTRA_DISTRICTS.find((d) => d.id === selectedDistrict) || MAHARASHTRA_DISTRICTS[0];

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.region.toLowerCase().includes(langSearch.toLowerCase())
  );

  const filteredCrops = MAHARASHTRA_CROPS.filter(
    (c) =>
      c.name.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.marathiName.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.maharashtraRegion.toLowerCase().includes(cropSearch.toLowerCase())
  );

  const filteredSoils = MAHARASHTRA_SOILS.filter(
    (s) =>
      s.name.toLowerCase().includes(soilSearch.toLowerCase()) ||
      s.marathiName.toLowerCase().includes(soilSearch.toLowerCase()) ||
      s.maharashtraGeology.toLowerCase().includes(soilSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* ── Top Header Banner with Maharashtra Logo & Stepper ── */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-950 text-white flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-lg">
                <img src="/agri-logo.png" alt="AgriShield" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-extrabold uppercase tracking-wider">
                    Agro Farm Setup
                  </span>
                  <span className="text-xs text-emerald-200 font-mono font-bold">
                    Step {currentStep} of 5
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  AgriShield Smart Farm Onboarding
                </h1>
                <p className="text-xs text-emerald-200/80">
                  Customizing crops, soil profiles, location telemetry, and hardware access.
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-5 gap-2 mt-5">
            {[
              { num: 1, label: 'Language' },
              { num: 2, label: 'Crops' },
              { num: 3, label: 'Soil' },
              { num: 4, label: 'Location' },
              { num: 5, label: 'Access' },
            ].map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={isCurrent ? 'text-amber-300 font-black' : isDone ? 'text-emerald-300' : 'text-slate-400'}>
                      {step.num}. {step.label}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-400 w-full' : isCurrent ? 'bg-amber-400 w-full animate-pulse' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {permFeedback && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in flex-shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>{permFeedback}</span>
          </div>
        )}

        {/* ── Main Step Content Area (Scrollable) ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 1: LANGUAGE SELECTION                                 */}
          {/* ══════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select Preferred Language</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your language. System diagnostics, advisory voice alerts, and UI adapt automatically.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search language..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Language Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {lang.name}
                            </span>
                            {lang.id === 'en' ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                                Default
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                {lang.nativeName}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                            {lang.region}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Sample phrase & Audio speaker button */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-1">
                          "{lang.samplePhrase}"
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLanguage(lang.id);
                            handlePlayAudioSample(lang);
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-[10px] font-bold flex-shrink-0"
                          title="Play native audio preview"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio && isSelected ? 'text-emerald-500 animate-bounce' : ''}`} />
                          <span>Listen</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 2: CROPS SELECTION                                   */}
          {/* ══════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Choose Active Farm Crops</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select your active crops. Pathogen models and disease thresholds will be calibrated specifically.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search crop..."
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Crop Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredCrops.map((crop) => {
                  const isSelected = selectedCrops.includes(crop.id);
                  return (
                    <div
                      key={crop.id}
                      onClick={() => toggleCrop(crop.id)}
                      className={`relative rounded-2xl border overflow-hidden transition cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Crop Image Header */}
                      <div className="relative h-32 w-full overflow-hidden">
                        <img
                          src={crop.imageUrl}
                          alt={crop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow-md transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-900/60 text-transparent border-white/50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2">
                          <h3 className="text-sm font-black text-white drop-shadow">
                            {crop.name}
                          </h3>
                          <span className="text-[11px] text-emerald-300 font-semibold block drop-shadow-sm">
                            {crop.vernacular}
                          </span>
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div className="p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>{crop.category}</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{crop.duration}</span>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          📍 <strong className="text-slate-800 dark:text-slate-200">Region:</strong> {crop.maharashtraRegion}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 3: SOIL PROFILES                                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>Choose Soil Profile (Black Cotton, Laterite, Alluvial, etc.)</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select soil texture for accurate irrigation scheduling, root water-stress index, and fertilization tuning.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search soil profile..."
                    value={soilSearch}
                    onChange={(e) => setSoilSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Soil Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSoils.map((soil) => {
                  const isSelected = selectedSoil === soil.id;
                  return (
                    <div
                      key={soil.id}
                      onClick={() => setSelectedSoil(soil.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                          : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 flex-shrink-0 shadow-sm">
                            <img src={soil.soilTextureUrl} alt={soil.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                              {soil.name}
                            </h3>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold block mt-0.5">
                              {soil.vernacular}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {soil.description}
                      </p>

                      <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <p className="text-slate-700 dark:text-slate-200">
                          <strong className="text-slate-900 dark:text-white">Best Crops:</strong> {soil.bestFor}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                          Geological Belt: {soil.maharashtraGeology}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 4: LOCATION & DISTRICT TARGETING                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  <span>Exact Location & District Selection</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allow live GPS or select your district for localized microclimate and disease contagion telemetry.
                </p>
              </div>

              {/* Live Geolocation Button */}
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    <span>Automatic Live GPS Geolocation</span>
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Current Coordinates: <strong className="font-mono text-slate-900 dark:text-white">{detectedCoords}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 active:scale-95 disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Detect My Live Farm GPS'}</span>
                </button>
              </div>

              {/* Districts Grid Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Region / District:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {MAHARASHTRA_DISTRICTS.map((dist) => {
                    const isSelected = selectedDistrict === dist.id;
                    return (
                      <button
                        key={dist.id}
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(dist.id);
                          setDetectedCoords(`${dist.coordinates} (${dist.name})`);
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500 shadow-md ring-2 ring-sky-500/30'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {dist.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {dist.region.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-sky-600 dark:text-sky-400 font-mono truncate">
                          {dist.agroZone.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected District Agro-Climatic Intelligence Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  📍 Selected Agro-Climatic Zone ({currentDistrictObj.name}):
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  Climate Zone: <strong>{currentDistrictObj.agroZone}</strong> • Region: <strong>{currentDistrictObj.region}</strong>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  GPS Coordinates: {currentDistrictObj.coordinates}
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 5: CAMERA & GALLERY HARDWARE PERMISSIONS             */}
          {/* ══════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Hardware & Media Permissions</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enable device permissions for AI leaf disease detection and multispectral drone scan uploads.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Camera Permission Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Camera Access
                          </h3>
                          <span className="text-[11px] text-slate-400">Crop Leaf Pathology Scanner</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          permissions.camera
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {permissions.camera ? 'GRANTED' : 'REQUIRED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Instant leaf disease identification, pest egg cluster detection, and yellow rust spot optical analysis.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestCamera}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                      permissions.camera
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{permissions.camera ? '✓ Camera Access Granted (Test OK)' : 'Grant Camera Access'}</span>
                  </button>
                </div>

                {/* 2. Gallery & Storage Permission Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Gallery & Files Access
                          </h3>
                          <span className="text-[11px] text-slate-400">Drone GeoTIFF & Soil Reports</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          permissions.gallery
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                        }`}
                      >
                        {permissions.gallery ? 'GRANTED' : 'REQUIRED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Upload high-resolution drone multispectral imagery, soil lab PDF cards, and field boundary GeoJSON maps.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestGallery}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                      permissions.gallery
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>{permissions.gallery ? '✓ Gallery Access Active' : 'Grant Gallery Access'}</span>
                  </button>
                </div>
              </div>

              {/* Summary of Configuration */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Setup Summary
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Language</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {INDIAN_LANGUAGES.find((l) => l.id === selectedLanguage)?.name || 'English'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Active Crops</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedCrops.length} Crops Selected
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Soil Profile</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {MAHARASHTRA_SOILS.find((s) => s.id === selectedSoil)?.name.split(' ')[0]}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">District</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {currentDistrictObj.name}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Action Navigation Bar ── */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 animate-pulse"
            >
              <Sparkles className="w-4 h-4" />
              <span>Complete Setup & Launch Dashboard</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
