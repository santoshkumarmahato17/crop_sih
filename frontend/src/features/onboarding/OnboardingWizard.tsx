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
  Plus,
  MapPin,
  Bell,
  Camera,
  Video,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth, OnboardingData } from '@/context/AuthContext';

interface LanguageOption {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  samplePhrase: string;
  region: string;
}

const INDIAN_LANGUAGES: LanguageOption[] = [
  { id: 'en', name: 'English', nativeName: 'English (Global)', code: 'en-US', samplePhrase: 'Welcome to AGRI SHIELD crop health monitoring.', region: 'International / India' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்', code: 'ta-IN', samplePhrase: 'வணக்கம்! அக்ரி ஷீல்ட் பயிர் பாதுகாப்பு அமைப்புக்கு உங்களை வரவேற்கிறோம்.', region: 'Tamil Nadu & Puducherry' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिन्दी', code: 'hi-IN', samplePhrase: 'नमस्ते! एग्री शील्ड फसल स्वास्थ्य और कीट निगरानी में आपका स्वागत है।', region: 'North & Central India' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు', code: 'te-IN', samplePhrase: 'నమస్కారం! అగ్రి షీల్డ్ పంట ఆరోగ్య వ్యవస్థకు మీకు స్వాగతం.', region: 'Andhra Pradesh & Telangana' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn-IN', samplePhrase: 'ನಮಸ್ಕಾರ! ಅಗ್ರಿ ಶೀಲ್ಡ್ ಬೆಳೆ ಸಂರಕ್ಷಣಾ ವ್ಯವಸ್ಥೆಗೆ ಸ್ವಾಗತ.', region: 'Karnataka' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml-IN', samplePhrase: 'നമസ്കാരം! അഗ്രി ഷീൽഡ് വിള സംരക്ഷണ സിസ്റ്റത്തിലേക്ക് സ്വാഗതം.', region: 'Kerala' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी', code: 'mr-IN', samplePhrase: 'नमस्कार! एग्री शील्ड पीक आरोग्य प्रणालीमध्ये आपले स्वागत आहे.', region: 'Maharashtra' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা', code: 'bn-IN', samplePhrase: 'নমস্কার! এগ্রি শিল্ড শস্য সুরক্ষা ব্যবস্থায় আপনাকে স্বাগতম।', region: 'West Bengal & Tripura' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu-IN', samplePhrase: 'નમસ્તે! એગ્રી શીલ્ડ પાક સંરક્ષણ સિસ્ટમમાં આપનું સ્વાગત છે.', region: 'Gujarat' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa-IN', samplePhrase: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਐਗਰੀ ਸ਼ੀਲਡ ਫ਼ਸਲ ਸੰਭਾਲ ਪ੍ਰਣਾਲੀ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।', region: 'Punjab' },
];

interface CropOption {
  id: string;
  name: string;
  vernacular: string;
  category: string;
  imageUrl: string;
  duration: string;
}

const RECOMMENDED_CROPS: CropOption[] = [
  {
    id: 'paddy',
    name: 'Paddy / Rice',
    vernacular: 'நெல் • धान',
    category: 'Cereal / Food Grain',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    duration: '110 - 140 Days',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    vernacular: 'கோதுமை • गेहूं',
    category: 'Cereal / Grain',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80',
    duration: '120 - 150 Days',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    vernacular: 'கரும்பு • गन्ना',
    category: 'Cash Crop',
    imageUrl: 'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=400&q=80',
    duration: '300 - 365 Days',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    vernacular: 'பருத்தி • कपास',
    category: 'Fiber Crop',
    imageUrl: 'https://images.unsplash.com/photo-1594904351111-a072f80b1a71?auto=format&fit=crop&w=400&q=80',
    duration: '160 - 180 Days',
  },
  {
    id: 'maize',
    name: 'Maize / Corn',
    vernacular: 'மக்காச்சோளம் • मक्का',
    category: 'Coarse Grain',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=80',
    duration: '90 - 110 Days',
  },
  {
    id: 'tomato',
    name: 'Tomato',
    vernacular: 'தக்காளி • टमाटर',
    category: 'Horticulture / Vegetable',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    duration: '90 - 120 Days',
  },
  {
    id: 'chili',
    name: 'Chili / Pepper',
    vernacular: 'மிளகாய் • मिर्च',
    category: 'Spice Crop',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=400&q=80',
    duration: '120 - 150 Days',
  },
  {
    id: 'banana',
    name: 'Banana',
    vernacular: 'வாழை • केला',
    category: 'Fruit Plantation',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    duration: '330 - 360 Days',
  },
];

interface SoilOption {
  id: string;
  name: string;
  vernacular: string;
  colorClass: string;
  borderClass: string;
  description: string;
  bestFor: string;
}

const RECOMMENDED_SOILS: SoilOption[] = [
  {
    id: 'alluvial',
    name: 'Alluvial Silt Soil',
    vernacular: 'வண்டல் மண் • जलोढ़ मिट्टी',
    colorClass: 'bg-amber-900/30 text-amber-300',
    borderClass: 'border-amber-700/50',
    description: 'High fertility silt deposited by river deltas. Rich in potash & humus.',
    bestFor: 'Paddy, Wheat, Sugarcane & Jute',
  },
  {
    id: 'red_loam',
    name: 'Red Loamy Soil',
    vernacular: 'செம்மண் • लाल मिट्टी',
    colorClass: 'bg-rose-900/30 text-rose-300',
    borderClass: 'border-rose-700/50',
    description: 'Iron oxide rich, highly porous with good aeration and quick drainage.',
    bestFor: 'Groundnut, Cotton, Millets & Pulses',
  },
  {
    id: 'black_regur',
    name: 'Black Regur Soil',
    vernacular: 'கரிசல் மண் • काली मिट्टी',
    colorClass: 'bg-slate-950 text-slate-200',
    borderClass: 'border-slate-700/60',
    description: 'High clay content with self-ploughing moisture retention properties.',
    bestFor: 'Cotton, Citrus, Sugarcane & Tobacco',
  },
  {
    id: 'laterite',
    name: 'Laterite Soil',
    vernacular: 'லேட்டரைட் • लेटराइट',
    colorClass: 'bg-orange-950/40 text-orange-300',
    borderClass: 'border-orange-700/50',
    description: 'Leached tropical soil with high iron and aluminum hydroxide deposits.',
    bestFor: 'Tea, Coffee, Cashew & Rubber',
  },
  {
    id: 'desert_sandy',
    name: 'Desert Sandy Soil',
    vernacular: 'மணல் மண் • बलुई मिट्टी',
    colorClass: 'bg-yellow-900/20 text-yellow-300',
    borderClass: 'border-yellow-600/40',
    description: 'Coarse sand particles with high drainage and low moisture capacity.',
    bestFor: 'Bajra, Barley, Dates & Pulses',
  },
  {
    id: 'peaty_clay',
    name: 'Peaty Clay Soil',
    vernacular: 'களிமண் • चिकनी मिट्टी',
    colorClass: 'bg-emerald-950/40 text-emerald-300',
    borderClass: 'border-emerald-700/50',
    description: 'Organic matter rich marshy soil with dark shade and high acidity.',
    bestFor: 'Paddy, Spices & Coastal Vegetables',
  },
];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Language
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ta');
  const [langSearch, setLangSearch] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Step 2: Crops
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['paddy', 'tomato']);
  const [cropSearch, setCropSearch] = useState<string>('');
  const [customCropInput, setCustomCropInput] = useState<string>('');

  // Step 3: Soil
  const [selectedSoil, setSelectedSoil] = useState<string>('red_loam');
  const [soilSearch, setSoilSearch] = useState<string>('');
  const [customSoilInput, setCustomSoilInput] = useState<string>('');

  // Step 4: Permissions
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    camera: true,
    video: true,
  });
  const [permFeedback, setPermFeedback] = useState<string | null>(null);

  // Play audio sample using HTML5 SpeechSynthesis
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

  // Permission Request Triggers
  const handleRequestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissions((prev) => ({ ...prev, location: true }));
          setPermFeedback('📍 Geolocation permission granted!');
          setTimeout(() => setPermFeedback(null), 3000);
        },
        () => {
          setPermissions((prev) => ({ ...prev, location: true }));
          setPermFeedback('📍 Location enabled for precision field map telemetry.');
          setTimeout(() => setPermFeedback(null), 3000);
        }
      );
    } else {
      setPermissions((prev) => ({ ...prev, location: true }));
    }
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        setPermissions((prev) => ({ ...prev, notifications: true }));
        setPermFeedback('🔔 Notification permission granted!');
      } else {
        setPermissions((prev) => ({ ...prev, notifications: true }));
        setPermFeedback('🔔 Push notification channel enabled.');
      }
    } else {
      setPermissions((prev) => ({ ...prev, notifications: true }));
    }
    setTimeout(() => setPermFeedback(null), 3000);
  };

  const handleAddCustomCrop = () => {
    if (customCropInput.trim() && !selectedCrops.includes(customCropInput.trim())) {
      setSelectedCrops((prev) => [...prev, customCropInput.trim()]);
      setCustomCropInput('');
    }
  };

  const handleAddCustomSoil = () => {
    if (customSoilInput.trim()) {
      setSelectedSoil(customSoilInput.trim());
      setCustomSoilInput('');
    }
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
      permissions,
    };
    completeOnboarding(finalData);
    navigate('/');
  };

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.region.toLowerCase().includes(langSearch.toLowerCase())
  );

  const filteredCrops = RECOMMENDED_CROPS.filter(
    (c) =>
      c.name.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.vernacular.toLowerCase().includes(cropSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(cropSearch.toLowerCase())
  );

  const filteredSoils = RECOMMENDED_SOILS.filter(
    (s) =>
      s.name.toLowerCase().includes(soilSearch.toLowerCase()) ||
      s.vernacular.toLowerCase().includes(soilSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(soilSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header & Wizard Stepper */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>AGRI SHIELD Initial Onboarding Setup</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Step {currentStep} of 5
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize your localized agronomic engine before accessing full features.
              </p>
            </div>
          </div>

          {/* Progress Bar & Pills */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === currentStep
                    ? 'w-8 bg-emerald-500'
                    : step < currentStep
                    ? 'w-4 bg-emerald-700/60'
                    : 'w-4 bg-slate-300 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content Viewport */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: LANGUAGE & AUDIO PREVIEW */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select Preferred Language & Audio Prompt</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose your native language. All UI descriptions, text, and AI voice guidance will adjust automatically.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    placeholder="Search language..."
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Language Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <div
                      key={lang.id}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {lang.name}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                              {lang.nativeName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {lang.region}
                          </p>
                        </div>
                      </div>

                      {/* Speech Audio Test Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLanguage(lang.id);
                          handlePlayAudioSample(lang);
                        }}
                        title="Listen to sample audio prompt"
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:scale-105 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
                      >
                        <Volume2 className={`w-4 h-4 ${isPlayingAudio && isSelected ? 'animate-bounce text-emerald-500' : ''}`} />
                        <span className="hidden sm:inline">Audio</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: CROPS SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Choose Primary Crops Under Cultivation</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select recommended crops or add custom crop varieties for tailored disease diagnostic scans.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    placeholder="Search crops..."
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Crop Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-h-[45vh] overflow-y-auto pr-1">
                {filteredCrops.map((crop) => {
                  const isSelected = selectedCrops.includes(crop.id);
                  return (
                    <div
                      key={crop.id}
                      onClick={() => toggleCrop(crop.id)}
                      className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="h-24 w-full relative overflow-hidden bg-slate-800">
                        <img
                          src={crop.imageUrl}
                          alt={crop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div
                          className={`absolute top-2 right-2 p-1 rounded-full ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-900/60 text-slate-300 backdrop-blur-sm'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {crop.category}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {crop.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {crop.vernacular}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Crop Add Option */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Other Crop Variety?</span>
                </span>
                <div className="flex items-center gap-2 flex-1 w-full">
                  <input
                    type="text"
                    value={customCropInput}
                    onChange={(e) => setCustomCropInput(e.target.value)}
                    placeholder="Type custom crop (e.g. Cardamom, Arecanut, Turmeric)..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCrop}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Add Crop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SOIL TYPE SELECTION */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select Holding Soil Type</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Soil classification tunes irrigation models and water requirement intelligence.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={soilSearch}
                    onChange={(e) => setSoilSearch(e.target.value)}
                    placeholder="Search soil types..."
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Soil Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[45vh] overflow-y-auto pr-1">
                {filteredSoils.map((soil) => {
                  const isSelected = selectedSoil === soil.id || selectedSoil === soil.name;
                  return (
                    <div
                      key={soil.id}
                      onClick={() => setSelectedSoil(soil.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${soil.colorClass} ${soil.borderClass}`}
                            >
                              {soil.vernacular}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {soil.name}
                          </h3>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {soil.description}
                      </p>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        Best for: {soil.bestFor}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Soil Input */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Custom Soil Profile?</span>
                </span>
                <div className="flex items-center gap-2 flex-1 w-full">
                  <input
                    type="text"
                    value={customSoilInput}
                    onChange={(e) => setCustomSoilInput(e.target.value)}
                    placeholder="Type soil composition (e.g. Silt Clay Loam, Saline Coastal)..."
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSoil}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Select Soil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PERMISSIONS SETUP */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Authorize Essential Application Permissions</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allow camera, video, location, and notification access for real-time disease early detection.
                </p>
              </div>

              {permFeedback && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{permFeedback}</span>
                </div>
              )}

              <div className="space-y-3.5">
                {/* Location Access */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          GPS & Location Access
                        </h3>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono font-bold">
                          {permissions.location ? 'Granted' : 'Recommended'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Required for precision GIS field mapping, weather advisories & regional outbreak alerts.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestLocation}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      permissions.location
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {permissions.location ? <Check className="w-4 h-4" /> : null}
                    <span>{permissions.location ? 'Location Active' : 'Grant Location'}</span>
                  </button>
                </div>

                {/* Notification Access */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Outbreak & Diagnostics Push Notifications
                        </h3>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold">
                          {permissions.notifications ? 'Granted' : 'Recommended'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Receive instant alert banners when neighbor farms report contagious crop blights.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      permissions.notifications
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    {permissions.notifications ? <Check className="w-4 h-4" /> : null}
                    <span>{permissions.notifications ? 'Notifications Active' : 'Enable Notifications'}</span>
                  </button>
                </div>

                {/* Camera Access */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Camera & Leaf Scan Access
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Capture diseased leaf photos directly for instant AI vision neural net diagnosis.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.camera}
                    onChange={(e) => setPermissions({ ...permissions, camera: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
                  />
                </div>

                {/* Video Upload Access */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Video Upload & Drone Telemetry Access
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Upload MP4 aerial video clips from smartphones or drones for field analysis.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.video}
                    onChange={(e) => setPermissions({ ...permissions, video: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUMMARY */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center sm:text-left">
              <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Onboarding Profile Ready</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review your configured preferences before launching the complete AGRI SHIELD workspace.
                </p>
              </div>

              {/* Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Language & Audio
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {INDIAN_LANGUAGES.find((l) => l.id === selectedLanguage)?.name} (
                    {INDIAN_LANGUAGES.find((l) => l.id === selectedLanguage)?.nativeName})
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Audio prompts enabled
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" /> Selected Crops ({selectedCrops.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedCrops.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md"
                      >
                        {RECOMMENDED_CROPS.find((item) => item.id === c)?.name || c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" /> Holding Soil Profile
                  </span>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {RECOMMENDED_SOILS.find((s) => s.id === selectedSoil)?.name || selectedSoil}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hydrological model calibrated
                  </p>
                </div>
              </div>

              {/* Ready Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-2 shadow-lg shadow-emerald-600/20">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Full Application User Interface Unlocked!</span>
                </h3>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Your customized holding profile, disease diagnostic neural net, and precision spatial map are ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <span>Continue Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95"
            >
              <span>Launch AGRI SHIELD Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
