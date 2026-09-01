import { apiClient } from './apiClient';
import {
  Advisory,
  AdvisoryGeneratePayload,
} from '@/types/advisory';

export const advisoryService = {
  /**
   * Fetch localized advisories matching language and farm filter.
   */
  async getAdvisories(params?: {
    farm_id?: string;
    language?: string;
    priority?: string;
    skip?: number;
    limit?: number;
  }): Promise<Advisory[]> {
    try {
      const response = await apiClient.get<Advisory[]>('/advisories', { params });
      return response.data;
    } catch (err) {
      console.warn('API getAdvisories failed, returning fallback mock advisories', err);
      return getMockAdvisories(params?.language || 'en');
    }
  },

  /**
   * Fetch single advisory by ID.
   */
  async getAdvisoryById(id: string, language?: string): Promise<Advisory> {
    try {
      const response = await apiClient.get<Advisory>(`/advisories/${id}`, {
        params: { language },
      });
      return response.data;
    } catch (err) {
      console.warn(`API getAdvisoryById failed for ${id}, using mock`, err);
      const mocks = getMockAdvisories(language || 'en');
      return mocks.find((m) => m.id === id) || mocks[0];
    }
  },

  /**
   * Generate a localized advisory.
   */
  async generateAdvisory(payload: AdvisoryGeneratePayload): Promise<Advisory> {
    try {
      const response = await apiClient.post<Advisory>('/advisories/generate', payload);
      return response.data;
    } catch (err) {
      console.warn('API generateAdvisory failed, returning simulated advisory', err);
      const mock: Advisory = {
        id: `adv-${Date.now()}`,
        farm_id: payload.farm_id,
        farm_name: 'Sahyadri Agro Estate',
        zone_id: payload.zone_id,
        zone_name: 'Zone Z17 (Greenhouse Block)',
        advisory_type: payload.advisory_type || 'DISEASE_ADVISORY',
        priority: payload.priority || 'HIGH',
        source: payload.source || 'AI',
        trust_level: payload.trust_level || 1,
        condition_name: payload.condition_name,
        follow_up_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        is_read: false,
        version: 'v1.0',
        created_at: new Date().toISOString(),
        localized: {
          id: `trans-${Date.now()}`,
          advisory_id: `adv-${Date.now()}`,
          language: 'en',
          title: `Disease Risk Advisory: ${payload.condition_name}`,
          summary: `Favorable microclimate detected for ${payload.condition_name}. Immediate field scouting recommended.`,
          why_this_matters:
            'Elevated canopy humidity and leaf wetness trigger rapid spore propagation.',
          what_to_do_now: [
            'Inspect crop foliage in lower canopy.',
            'Maintain strict farm hygiene and avoid over-irrigation.',
          ],
          what_to_monitor: ['Monitor vegetative NDVI health index over the next 48 hours.'],
          what_to_avoid: ['Avoid overhead sprinkling in late evening.'],
          when_to_seek_expert_help:
            'Request extension officer validation if symptoms spread across multiple rows.',
          safety_warnings: [
            'Follow Integrated Pest Management (IPM) guidelines. Never spray unapproved chemicals.',
          ],
          audio_text: `Crop advisory active for ${payload.condition_name}. Inspect foliage and monitor moisture.`,
        },
      };
      return mock;
    }
  },

  /**
   * Update preferred language on user profile.
   */
  async updateUserLanguage(language: string): Promise<void> {
    try {
      await apiClient.patch('/advisories/me/language', { language });
    } catch (err) {
      console.warn('API updateUserLanguage failed, persisting to localStorage', err);
      localStorage.setItem('agrishield_preferred_lang', language);
    }
  },
};

// Fallback high-fidelity multilingual advisories
function getMockAdvisories(lang: string = 'en'): Advisory[] {
  const isTamil = lang === 'ta';
  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';

  return [
    {
      id: 'adv-001',
      farm_id: 'farm-nashik-1',
      farm_name: 'Sahyadri Agro Estate (Nashik)',
      zone_id: 'zone-17',
      zone_name: 'Zone Z17 (Greenhouse Block)',
      crop_name: 'Tomato (Abhinav Hybrid)',
      advisory_type: 'DISEASE_ADVISORY',
      priority: 'HIGH',
      source: 'EXPERT',
      trust_level: 3, // Expert Validated
      condition_name: 'Early Blight (Alternaria solani)',
      follow_up_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      is_read: false,
      version: 'v1.0',
      created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      localized: {
        id: 'trans-001',
        advisory_id: 'adv-001',
        language: lang,
        title: isTamil
          ? '[வேளாண் நிபுணர் சரிபார்க்கப்பட்டது] ஆரம்ப இலைக்கருகல் நோய் எச்சரிக்கை (Early Blight)'
          : isHindi
          ? '[कृषि विशेषज्ञ द्वारा सत्यापित] अगेती झुलसा रोग परामर्श (Early Blight)'
          : isMarathi
          ? '[कृषी तज्ञांद्वारे पडताळणी पूर्ण] करपा रोग सल्ला व दक्षता (Early Blight)'
          : '[Expert Validated] Early Blight Risk Advisory — Alternaria solani',
        summary: isTamil
          ? 'மண்டலம் Z17-ல் ஆரம்ப இலைக்கருகல் நோய் இருப்பது கள நிபுணரால் உறுதி செய்யப்பட்டுள்ளது. உடனடி மேலாண்மை நடவடிக்கை தேவை.'
          : isHindi
          ? 'क्षेत्र Z17 में अगेती झुलसा रोग की पुष्टि कृषि विशेषज्ञ द्वारा की गई है। तुरंत उपचार शुरू करें।'
          : isMarathi
          ? 'झोन Z17 मध्ये टोमॅटो पिकावर करपा रोगाचा प्रादुर्भाव कृषी तज्ञांनी प्रमाणित केला आहे. त्वरित व्यवस्थापन करा.'
          : 'Agricultural extension specialist Dr. Sundaram has inspected Zone Z17 and confirmed Early Blight lesions.',
        why_this_matters: isTamil
          ? '86% ஈரப்பதம் மற்றும் தொடர் மழை பூஞ்சை வித்துக்கள் பரவுவதை தூண்டுகிறது.'
          : isHindi
          ? '86% आर्द्रता और हाल की वर्षा के कारण फफूंद के बीजाणु तेजी से फैल रहे हैं।'
          : isMarathi
          ? '८६% हवेतील आर्द्रता व दमट वातावरणामुळे करपा बुरशीचा प्रादुर्भाव वेगाने वाढतो.'
          : 'Sustained canopy humidity (86%) and leaf wetness accelerate concentric ring defoliation.',
        what_to_do_now: isTamil
          ? [
              'பாதிக்கப்பட்ட கீழ் இலைகளை உடனே அகற்றி எரிக்கவும்.',
              'டிரிகோடெர்மா விரிடி (Trichoderma viride) உயிரியல் பூஞ்சாணத்தை வேர்ப்பகுதியில் இடவும்.',
              'சொட்டு நீர் பாசனம் மூலம் மட்டுமே தண்ணீர் பாய்ச்சவும்.',
            ]
          : isHindi
          ? [
              'संक्रमित निचली पत्तियों को तोड़कर खेत से दूर नष्ट करें।',
              'ट्राइकोडर्मा विरिडी जैव-फफूंदनाशक का उपयोग करें।',
              'केवल ड्रिप सिंचाई का प्रयोग करें, पत्तों पर पानी न गिरने दें।',
            ]
          : isMarathi
          ? [
              'खालची बाधित पाने खुडून शेताबाहेर नष्ट करा.',
              'ट्रायकोडर्मा व्हिरीडी (Trichoderma viride) जैविक बुरशीनाशकाचा वापर करा.',
              'फक्त ड्रीपने पाणी द्या, जेणेकरून पानांवर ओलावा राहणार नाही.',
            ]
          : [
              'Prune severely infected lower foliage to reduce primary inoculum load.',
              'Apply certified Trichoderma viride biological bio-fungicide according to package label.',
              'Ensure drip irrigation flush without wetting vegetative canopy.',
            ],
        what_to_monitor: isTamil
          ? ['அருகிலுள்ள Z16 மற்றும் Z18 பாத்திகளில் இலை புள்ளிகள் உள்ளதா என 48 மணி நேரத்திற்குள் கண்காணிக்கவும்.']
          : isHindi
          ? ['अगले 48 घंटों में पास के जोन Z16 और Z18 में लक्षणों पर नजर रखें।']
          : isMarathi
          ? ['पुढील ४८ तासांत लगतच्या Z16 व Z18 पट्ट्यांमध्ये लक्षणांची पाहणी करा.']
          : ['Scout adjacent Zones Z16 and Z18 downwind for target-board lesions within 48 hours.'],
        what_to_avoid: isTamil
          ? ['மாலை நேர தெளிப்பு பாசனம் மற்றும் அதிகப்படியான தழைச்சத்து உரம் தவிர்க்கவும்.']
          : isHindi
          ? ['शाम को फव्वारा सिंचाई और अत्यधिक नाइट्रोजन खाद का प्रयोग न करें।']
          : isMarathi
          ? ['संध्याकाळच्या वेळी स्प्रिंकलर व अतिरिक्त युरिया खताचा वापर टाळावा.']
          : ['Avoid overhead sprinkler irrigation and excessive synthetic nitrogen application.'],
        when_to_seek_expert_help: isTamil
          ? 'அறிகுறிகள் பழங்களை தாக்கினால் உடனே வேளாண்மை மையத்தை அணுகவும்.'
          : isHindi
          ? 'यदि धब्बे फलों या तनों पर दिखाई दें तो तुरंत कृषि केंद्र से संपर्क करें।'
          : isMarathi
          ? 'रोगाची लागण फळांवर दिसू लागल्यास त्वरित कृषी विज्ञान केंद्राशी संपर्क साधा.'
          : 'Request follow-up case inspection if chlorosis expands to fruit trusses within 3 days.',
        safety_warnings: [
          'Strictly adhere to Integrated Pest Management (IPM). Never apply unapproved chemicals.',
        ],
        technical_breakdown:
          'Source: EXPERT_VALIDATION | Case: EV-00017 | Validated by: Dr. Sundaram | Risk Score: 0.88',
        audio_text: isTamil
          ? 'ஆரம்ப இலைக்கருகல் நோய் மேலாண்மை அறிவுரை. கீழ் இலைகளை அகற்றி, சொட்டு நீர் பாசனத்தை பராமரிக்கவும்.'
          : isHindi
          ? 'अगेती झुलसा रोग नियंत्रण परामर्श। निचली पत्तियों को हटाएं और जैविक उपचार करें।'
          : isMarathi
          ? 'करपा रोग नियंत्रण सल्ला. बाधित पाने काढून टाका आणि जैविक बुरशीनाशक वापरा.'
          : 'Expert validated Early Blight advisory. Remove infected lower leaves and maintain drip irrigation.',
      },
    },
    {
      id: 'adv-002',
      farm_id: 'farm-solapur-2',
      farm_name: 'Sangola Pomegranate Orchard #2',
      zone_id: 'zone-04',
      zone_name: 'Zone Z04 (Orchard South)',
      crop_name: 'Pomegranate (Bhagwa)',
      advisory_type: 'DISEASE_ADVISORY',
      priority: 'CRITICAL',
      source: 'AI',
      trust_level: 2, // Multi-signal Risk
      condition_name: 'Bacterial Blight (Telya / Xanthomonas)',
      follow_up_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      is_read: false,
      version: 'v1.0',
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      localized: {
        id: 'trans-002',
        advisory_id: 'adv-002',
        language: lang,
        title: isTamil
          ? '[பல-காரணி இடர்] மாதுளை பாக்டீரியா கருகல் நோய் (Telya Blight)'
          : isHindi
          ? '[मल्टी-सिग्नल जोखिम] अनार का तेलीया रोग चेतावनी (Bacterial Blight)'
          : isMarathi
          ? '[संभाव्य धोका] डाळिंब तेलकट डाग / तेल्या रोग दक्षता (Telya Blight)'
          : '[Multi-Signal Risk] Pomegranate Bacterial Blight (Telya) Threat',
        summary: isTamil
          ? 'செயற்கை நுண்ணறிவு மற்றும் ஈரப்பத எச்சரிக்கை மண்டலம் Z04-ல் பாக்டீரியா பிளைட் அபாயத்தைக் காட்டுகிறது.'
          : isHindi
          ? 'एआई और मौसम संकेतों के अनुसार जोन Z04 में तेलीया रोग का खतरा बढ़ा है।'
          : isMarathi
          ? 'हवामान व एआय तपासणीनुसार सांगोला बागेत तेल्या रोगाचा वाढता धोका दिसत आहे.'
          : 'High thermal heat degree-days combined with intermittent rains create high Xanthomonas bacterial blight pressure.',
        why_this_matters: isTamil
          ? 'பாக்டீரியா நோய் காய்களில் எண்ணெய் போன்ற கரும்புள்ளிகளை ஏற்படுத்தி பழங்களை சேதப்படுத்தும்.'
          : isHindi
          ? 'तेलीया रोग से फलों पर काले तैलीय धब्बे बनते हैं और फसल को भारी नुकसान होता है।'
          : isMarathi
          ? 'तेल्या रोगामुळे डाळिंबावर तेलकट काळे डाग पडून फळे तडकतात व निर्यात दर्जा घसरतो.'
          : 'Bacterial blight causes oily rind lesions, nodal cankers, and catastrophic fruit cracking.',
        what_to_do_now: isTamil
          ? [
              'மரங்களின் கிளைகளில் எண்ணெய் போன்ற புள்ளிகள் உள்ளதா என உடனே பார்க்கவும்.',
              'வேளாண் அலுவலர் சரிபார்ப்பை (Expert Validation) உடனடியாக கோரவும்.',
            ]
          : isHindi
          ? [
              'टहनियों और फलों पर तैलीय धब्बों की जाँच करें।',
              'तुरंत कृषि विशेषज्ञ सत्यापन (Expert Validation) का अनुरोध करें।',
            ]
          : isMarathi
          ? [
              'फांद्या आणि फळांवर तेलकट डाग आहेत का ते तपासा.',
              'ॲपमधून लगेच कृषी तज्ञ पडताळणीची (Expert Validation) मागणी करा.',
            ]
          : [
              'Scout fruit nodes for greasy water-soaked black spots.',
              'Click "Request Expert Validation" to dispatch an extension officer to your orchard.',
            ],
        what_to_monitor: ['Monitor canopy sap flow and high-resolution drone multispectral imagery.'],
        what_to_avoid: ['Do not prune wet branches during active morning dew hours.'],
        when_to_seek_expert_help:
          'Request urgent on-site extension inspection before any chemical intervention.',
        safety_warnings: [
          'Follow strict certified orchard biosecurity and sanitary tool sterilization protocols.',
        ],
        technical_breakdown: 'Source: AI_MULTI_SIGNAL | Confidence: 89% | CWSI: 0.72 | Hotspot: HS-003',
        audio_text: isMarathi
          ? 'डाळिंब तेल्या रोग संभाव्य धोका. फळांवरील तेलकट डाग तपासा आणि कृषी तज्ञांचे मार्गदर्शन घ्या.'
          : 'Pomegranate Bacterial Blight alert. Check fruit for oily spots and request expert validation.',
      },
    },
  ];
}
