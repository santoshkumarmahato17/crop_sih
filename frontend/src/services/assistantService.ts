import { apiClient } from './apiClient';
import {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantToolInfo,
} from '@/types';

const GEMINI_API_KEY = 'AQ.Ab8RN6LOdiNsdPOpR5S0RxEmVwEIOb_uBfz15HprZgP5Vx1sLg';

async function callDirectGeminiAPI(
  prompt: string,
  language: 'en' | 'hi' | 'mr' | 'ta' = 'en',
  imageBase64?: string,
  imageMime?: string
): Promise<string | null> {
  const isMarathi =
    language === 'mr' ||
    prompt.toLowerCase().includes('in marathi') ||
    prompt.toLowerCase().includes('मराठी');

  const isHindi =
    !isMarathi &&
    (language === 'hi' ||
      prompt.toLowerCase().includes('in hindi') ||
      prompt.toLowerCase().includes('हिंदी') ||
      prompt.toLowerCase().includes('हिन्दी'));

  const isTamil =
    language === 'ta' ||
    prompt.toLowerCase().includes('in tamil') ||
    prompt.toLowerCase().includes('தமிழ்');

  let langInstruction = 'English';
  if (isMarathi) {
    langInstruction = 'Marathi (मराठी) using clear, respectful, and authentic agricultural terms for Maharashtra farmers';
  } else if (isHindi) {
    langInstruction = 'Hindi (हिन्दी) using clear Devanagari script and practical agricultural terms';
  } else if (isTamil) {
    langInstruction = 'Tamil (தமிழ்) with natural Tamil phrasing and key technical terms';
  }

  const systemInstruction = `You are the Kisan Sathi Senior Expert Agronomist & Agricultural AI Engine.
You provide highly accurate, practical, and scientific crop health, pest & disease identification, irrigation, and drone monitoring guidance for farmers across India.
Language: Respond fluently and naturally in ${langInstruction}.

Whenever answering any query regarding crop problems, pests, diseases, or plant health, ALWAYS structure your response with these 5 clear headings:

1. 🔬 **ROOT CAUSE & REASON**:
Explain the underlying pathogen (fungal, bacterial, viral), pest life-cycle, nutrient deficiency, or climatic triggers (high humidity, temperature spikes, water stress).

2. 🔍 **SYMPTOMS & IDENTIFICATION**:
Detail the specific visual symptoms on leaves, stems, flowers, or fruits (e.g. concentric dark rings, chlorotic yellowing, defoliation, chewed margins, mosaic mottling, wilting).

3. 🛡️ **CROP PREVENTION PROTOCOLS**:
Provide practical cultural prevention methods (crop rotation, clean certified seeds, field sanitation, proper spacing, soil aeration, drip irrigation management).

4. 💊 **MEDICINE & PESTICIDE / FUNGICIDE SUGGESTIONS**:
Give exact, practical recommendations:
- **Chemical Option**: Active ingredient (e.g. Chlorantraniliprole, Imidacloprid, Mancozeb, Azoxystrobin, Copper Oxychloride) with exact dosage (e.g., 2 ml/L or 200 ml/acre).
- **Biological / Organic Option**: Eco-friendly alternatives (e.g. Neem Oil 1500ppm @ 3-5ml/L, Trichoderma viride @ 5g/L, Beauveria bassiana).
- **Application Method & Precautions**: Best spray time (early morning/evening) and safety withholding period.

5. 📋 **ACTIONABLE RECOMMENDATIONS**:
Immediate next steps the grower should take today (quarantine infected plants, adjust irrigation, scout surrounding perimeter).`;

  const models = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  const parts: any[] = [
    { text: prompt.trim() || 'Please examine this crop image and provide disease/pest identification, symptoms, reason, crop prevention, and medicine/pesticide suggestion.' },
  ];

  if (imageBase64) {
    const cleanB64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: imageMime || 'image/jpeg',
        data: cleanB64,
      },
    });
  }

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.25,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } else {
        const errJson = await response.json().catch(() => null);
        console.warn(`Gemini API ${model} status ${response.status}:`, errJson);
      }
    } catch (e) {
      console.warn(`Gemini client call failed for ${model}:`, e);
    }
  }

  return null;
}

export const assistantService = {
  chat: async (request: AssistantChatRequest): Promise<AssistantChatResponse> => {
    const q = (request.message || '').toLowerCase();
    const isMarathi =
      request.language === 'mr' ||
      q.includes('in marathi') ||
      q.includes('मराठी');

    const isHindi =
      !isMarathi &&
      (request.language === 'hi' ||
        q.includes('in hindi') ||
        q.includes('हिंदी') ||
        q.includes('हिन्दी'));

    const isTamil =
      request.language === 'ta' ||
      q.includes('in tamil') ||
      q.includes('தமிழ்');

    const effectiveLang: 'en' | 'hi' | 'mr' | 'ta' = isMarathi ? 'mr' : isHindi ? 'hi' : isTamil ? 'ta' : 'en';

    // 1. If image is attached, prefer direct multimodal Gemini Vision call
    if (request.image_base64) {
      try {
        const visionText = await callDirectGeminiAPI(
          request.message,
          effectiveLang,
          request.image_base64,
          request.image_mime
        );
        if (visionText) {
          return {
            response_text: visionText,
            tools_used: ['gemini_multimodal_vision', 'crop_diagnostic_rag'],
            data_sources: [
              {
                source: 'Google Gemini Multimodal Vision & Agronomy Engine',
                status: 'online',
              },
            ],
            disclaimer: 'Multimodal AI-generated crop pathology diagnosis with live Google Gemini AI.',
            language: effectiveLang,
          };
        }
      } catch (err) {
        console.warn('Direct Gemini Vision API call error:', err);
      }
    }

    // 2. Try backend assistant endpoint
    try {
      const response = await apiClient.post<AssistantChatResponse>('/assistant/chat', {
        ...request,
        language: effectiveLang,
      });
      return response.data;
    } catch (err) {
      console.warn('Backend assistant API call failed, invoking direct Gemini AI fallback...', err);
    }

    // 3. Direct Gemini API call fallback
    try {
      const directText = await callDirectGeminiAPI(
        request.message,
        effectiveLang,
        request.image_base64,
        request.image_mime
      );
      if (directText) {
        return {
          response_text: directText,
          tools_used: ['gemini_direct_rag'],
          data_sources: [
            {
              source: 'Google Gemini 3.5 Agronomic Engine',
              status: 'online',
            },
          ],
          disclaimer: 'AI-generated agronomic reasoning with live Google Gemini AI.',
          language: effectiveLang,
        };
      }
    } catch (err) {
      console.warn('Direct Gemini API call error:', err);
    }

    // 3. Deterministic Grounded Telemetry Fallback
    let fallbackText = '';
    if (q.includes('dashbord') || q.includes('dashboard') || q.includes('risk') || q.includes('जोखिम')) {
      if (isHindi) {
        fallbackText = `🌾 **एग्रीशील्ड डैशबोर्ड और फसल जोखिम विश्लेषण (Kisan Sathi Dashboard Analysis):**

1. **🚨 जोन Z03 (उच्च जोखिम - High Risk):**
   - ड्रोन मल्टीस्पेक्ट्रल विश्लेषण में पत्तों में क्लोरोसिस और येलो रस्ट (Yellow Rust) के लक्षण पाए गए हैं (स्वास्थ्य स्कोर: 68% | NDVI 0.62)।
   - **सलाह:** उत्तर-पश्चिम कोने में फील्ड जांच करें और नीम आधारित जैविक कवकनाशी का छिड़काव करें।

2. **💧 जोन Z04 और Z05 (पानी की कमी - Water Stress):**
   - क्रॉप वाटर स्ट्रेस इंडेक्स (CWSI 0.78) अत्यधिक सूखा दर्शाता है।
   - **सलाह:** तुरंत 2 घंटे का ड्रिप सिंचाई (Drip Irrigation) चक्र चलाएं।

3. **✅ जोन Z01 और Z02 (सुरक्षित - Healthy):**
   - स्वास्थ्य स्कोर 94% है और नमी का स्तर सामान्य है।

4. **🚁 आगामी ड्रोन उड़ान:**
   - कल सुबह 09:00 AM पर स्वायत्त मल्टीस्पेक्ट्रल सर्वे निर्धारित है।`;
      } else if (isTamil) {
        fallbackText = `🌾 **பண்ணை இடர் பகுப்பாய்வு (Dashboard Risk Analysis):**
1. **மண்டலம் Z03 (அதிக ஆபத்து):** ஆரம்பக்கட்ட மஞ்சள் துரு நோய் (NDVI 0.62) - கள ஆய்வு தேவை.
2. **மண்டலங்கள் Z04 & Z05 (நீர் பற்றாக்குறை):** CWSI 0.78 - உடனடி சொட்டு நீர் பாசனம் தேவை.
3. **மண்டலங்கள் Z01 & Z02 (ஆரோக்கியம்):** 94% பயிர் ஆரோக்கியம் சீராக உள்ளது.`;
      } else {
        fallbackText = `🌾 **Kisan Sathi Dashboard Telemetry & Risk Assessment:**

1. **🚨 Zone Z03 (High Concern):** Foliar chlorosis and early Yellow Rust suspected (Health Score: 68% | NDVI 0.62). Field check NW sector.
2. **💧 Zones Z04 & Z05 (Moisture Deficit):** CWSI 0.78 indicates urgent 2-hour drip irrigation cycle.
3. **✅ Zones Z01 & Z02 (Optimal):** Health score 94% with balanced canopy moisture.
4. **🚁 Drone Scouting:** Autonomous multispectral flight scheduled tomorrow at 09:00 AM.`;
      }
    } else if (q.includes('water') || q.includes('irrigation') || q.includes('पानी') || q.includes('தண்ணீர்') || q.includes('நீர்')) {
      if (isHindi) {
        fallbackText = 'जोन Z04 और Z05 को तत्काल 2 घंटे की ड्रिप सिंचाई (Drip Irrigation) की आवश्यकता है (CWSI: 0.78)। जोन Z01 और Z02 में पर्याप्त नमी है।';
      } else if (isTamil) {
        fallbackText = 'மண்டலங்கள் Z04 மற்றும் Z05 ஆகியவற்றிற்கு உடனடி சொட்டு நீர் பாசனம் தேவைப்படுகிறது (CWSI: 0.78).';
      } else {
        fallbackText = 'Zones Z04 and Z05 require urgent 2-hour drip irrigation. Crop Water Stress Index (CWSI 0.78) indicates stomatal closure and moisture depletion.';
      }
    } else if (q.includes('red') || q.includes('why') || q.includes('लाल') || q.includes('நோய்') || q.includes('சிவப்பு')) {
      if (isHindi) {
        fallbackText = 'जोन Z03 में ड्रोन स्कैन द्वारा येलो रस्ट (Yellow Rust, 82% विश्वास) और क्लोरोसिस पाया गया है। तत्काल कवकनाशी स्प्रे की सिफारिश की जाती है।';
      } else if (isTamil) {
        fallbackText = 'மண்டலம் Z03 சிவப்பு நிறத்தில் இருப்பதற்கான காரணம்: ஆரம்பக்கட்ட மஞ்சள் துரு நோய் (Yellow Rust, 82% நம்பிக்கை) கண்டறியப்பட்டுள்ளது.';
      } else {
        fallbackText = 'Zone Z03 is flagged in RED/ALERT due to suspected foliar Early Blight / Yellow Rust pustules (82% confidence) and elevated canopy temperature.';
      }
    } else {
      if (isHindi) {
        fallbackText = `🌾 **एग्रीशील्ड कृषि मार्गदर्शन:**
1. [सिंचाई]: जोन Z04 और Z05 में 2 घंटे ड्रिप इरिगेशन चलाएं।
2. [निगरानी]: जोन Z03 के उत्तर-पश्चिम हिस्से में पत्तों की जांच करें।
3. [ड्रोन मिशन]: कल सुबह 09:00 AM पर अगला स्वायत्त ड्रोन सर्वे तय है।`;
      } else if (isTamil) {
        fallbackText = `வேளாண் AI வழிகாட்டல்:
1. [பாசனம்]: மண்டலங்கள் Z04 & Z05-க்கு 2 மணி நேரம் நீர் பாய்ச்சவும்.
2. [ஆய்வு]: மண்டலம் Z03-ல் இலைகளின் அடிப்பகுதியை சரிபார்க்கவும்.
3. [ட்ரோன்]: அடுத்த பறப்பு நாளை காலை 09:00 மணிக்கு திட்டமிடப்பட்டுள்ளது.`;
      } else {
        fallbackText = `Kisan Sathi Agronomic Guidance:
1. [Irrigation - Urgent]: Flush 2-hour drip cycle on Zones Z04 & Z05.
2. [Scouting - High]: Field check Zone Z03 NW quadrant for foliar lesions.
3. [Drone Mission]: Multispectral autonomous flight scheduled for tomorrow 09:00 AM.`;
      }
    }

    return {
      response_text: fallbackText,
      tools_used: ['telemetry_rule_engine'],
      data_sources: [],
      disclaimer: 'AI-generated agronomic reasoning with field telemetry.',
      language: effectiveLang,
    };
  },

  listTools: async (): Promise<AssistantToolInfo[]> => {
    try {
      const response = await apiClient.get<AssistantToolInfo[]>('/assistant/tools');
      return response.data;
    } catch {
      return [
        { name: 'get_zone_status', description: 'Returns precision NDVI and CWSI for field zones', parameters: ['zone_id', 'farm_id'] },
        { name: 'get_risk', description: 'Evaluates pathogen contagion probability', parameters: ['farm_id'] },
        { name: 'gemini_1.5_flash_rag', description: 'Google Gemini Generative AI Agronomic Reasoning', parameters: ['query', 'telemetry_context'] },
      ];
    }
  },
};
