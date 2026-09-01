"""
AGRI SHIELD — Multilingual Translation & Safe IPM Advisory Service.
Provides static curated regional dictionaries (English, Tamil, Hindi, Marathi)
and ensures strict adherence to Integrated Pest Management (IPM) safety rules.
"""

from typing import Dict, Any, List, Optional


class TranslationService:
    """Localized agricultural translation provider with strict agronomic safety guards."""

    SUPPORTED_LANGUAGES = ["en", "ta", "hi", "mr"]
    DEFAULT_LANGUAGE = "en"

    # Static Curated Dictionaries for Agronomic Conditions & Advisories
    TEMPLATES: Dict[str, Dict[str, Any]] = {
        "early_blight": {
            "en": {
                "title": "Early Blight Risk Advisory",
                "summary": "AI signals and microclimate indicators suggest potential Alternaria solani (Early Blight) foliar stress.",
                "why_this_matters": "High relative humidity and wet leaf duration accelerate spore germination, leading to concentric leaf spot lesions and defoliation.",
                "what_to_do_now": [
                    "Inspect lower and older leaves for dark brown concentric target-board spots.",
                    "Remove and safely dispose of severely infected lower foliage to reduce spore load.",
                    "Ensure furrow or drip irrigation avoids wetting foliage directly.",
                ],
                "what_to_monitor": [
                    "Check adjacent crop rows and downwind zones within 48 hours.",
                    "Monitor nighttime canopy humidity and leaf wetness duration.",
                ],
                "what_to_avoid": [
                    "Avoid overhead sprinkler irrigation during late evening hours.",
                    "Avoid excessive synthetic nitrogen application which softens vegetative tissue.",
                ],
                "when_to_seek_expert_help": "If lesions expand to more than 15% of the upper canopy or spread to fruit clusters, request an expert validation.",
                "safety_warnings": [
                    "Follow all certified organic bio-control practices and authorized agricultural university spray guidelines.",
                    "Never apply unauthorized synthetic fungicides without extension officer approval.",
                ],
                "audio_text": "Early Blight advisory active. Inspect lower leaves for dark spots, avoid wetting crop canopy, and consult local extension expert if lesions spread.",
            },
            "ta": {
                "title": "ஆரம்ப இலைக்கருகல் நோய் எச்சரிக்கை (Early Blight)",
                "summary": "வானிலை மற்றும் நுண்ணிய சென்சார் தகவல்கள் ஆரம்ப இலைக்கருகல் நோய் அபாயத்தைக் காட்டுகின்றன.",
                "why_this_matters": "அதிக ஈரப்பதம் மற்றும் இலைகளில் தங்கும் தண்ணீர் பூஞ்சை தொற்று பரவுவதை துரிதப்படுத்துகிறது.",
                "what_to_do_now": [
                    "செடியின் அடிப்பகுதி இலைகளில் வட்ட வடிவ பழுப்பு புள்ளிகள் உள்ளதா என உடனே பரிசோதிக்கவும்.",
                    "நோய்த்தொற்று தாக்கிய பழைய இலைகளை அகற்றி முறையாக அப்புறப்படுத்தவும்.",
                    "சொட்டு நீர் பாசனத்தை மட்டும் பயன்படுத்தி இலைகளில் தண்ணீர் படுவதைத் தவிர்க்கவும்.",
                ],
                "what_to_monitor": [
                    "அடுத்த 48 மணி நேரத்திற்குள் அருகிலுள்ள பாத்திகளை தீவிரமாக கண்காணிக்கவும்.",
                    "இரவு நேர ஈரப்பதம் மற்றும் இலை ஈரப்பத கால அளவை கண்காணிக்கவும்.",
                ],
                "what_to_avoid": [
                    "மாலை வேளைகளில் தெளிப்பு பாசனம் (Sprinkler) செய்வதைத் தவிர்க்கவும்.",
                    "அதிகப்படியான தழைச்சத்து (Nitrogen) உரம் இடுவதைத் தவிர்க்கவும்.",
                ],
                "when_to_seek_expert_help": "புள்ளிகள் மேல் இலைகளுக்கும் அல்லது காய்களுக்கும் பரவினால் உடனே வேளாண் அலுவலர் சரிபார்ப்பைக் கோரவும்.",
                "safety_warnings": [
                    "பரிந்துரைக்கப்பட்ட இயற்கை உயிர் பூஞ்சாண மருந்துகளை மட்டும் பயன்படுத்தவும்.",
                    "அங்கீகரிக்கப்படாத ரசாயன மருந்துகளை சுயமாக தெளிப்பதைத் தவிர்க்கவும்.",
                ],
                "audio_text": "ஆரம்ப இலைக்கருகல் எச்சரிக்கை. கீழ் இலைகளை பரிசோதிக்கவும், இலைகளில் தண்ணீர் தேங்காமல் பார்த்துக் கொள்ளவும்.",
            },
            "hi": {
                "title": "अगेती झुलसा रोग परामर्श (Early Blight)",
                "summary": "मौसम और एआई संकेतकों के अनुसार फसल में अगेती झुलसा (अल्टरनेरिया) का जोखिम बढ़ रहा है।",
                "why_this_matters": "अधिक आर्द्रता और पत्तों पर नमी रहने से फफूंद तेजी से फैलती है जिससे पत्तियों पर गोल भूरे धब्बे बनते हैं।",
                "what_to_do_now": [
                    "पौधों की निचली पत्तियों पर भूरे छल्लेदार धब्बों की सावधानीपूर्वक जाँच करें।",
                    "संक्रमित पत्तियों को तोड़कर खेत से दूर सुरक्षित स्थान पर नष्ट करें।",
                    "सिंचाई के समय पत्तों पर सीधा पानी छिड़कने से बचें और ड्रिप का उपयोग करें।",
                ],
                "what_to_monitor": [
                    "अगले 48 घंटों में आसपास के कतारों और पास के जोन की निगरानी करें।",
                    "रात के समय खेत में नमी के स्तर पर नजर रखें।",
                ],
                "what_to_avoid": [
                    "शाम के समय फव्वारा सिंचाई करने से बचें।",
                    "आवश्यकता से अधिक यूरिया (नाइट्रोजन) का प्रयोग न करें।",
                ],
                "when_to_seek_expert_help": "यदि रोग ऊपरी पत्तियों या फलों तक फैलने लगे तो तुरंत कृषि विशेषज्ञ सत्यापन का अनुरोध करें।",
                "safety_warnings": [
                    "केवल कृषि विश्वविद्यालय द्वारा अनुशंसित जैविक कीटनाशकों का प्रयोग करें।",
                    "बिना विशेषज्ञ सलाह के किसी भी रासायनिक कीटनाशक का अत्यधिक छिड़काव न करें।",
                ],
                "audio_text": "अगेती झुलसा रोग चेतावनी। निचली पत्तियों की जाँच करें, पत्तों पर पानी न ठहरने दें और कृषि विशेषज्ञ से सलाह लें।",
            },
            "mr": {
                "title": "करपा रोग सल्ला व दक्षता (Early Blight / Alternaria)",
                "summary": "हवामान घटक आणि एआय तपासणीनुसार पिकावर करपा रोगाचा संभाव्य धोका दिसून येत आहे.",
                "why_this_matters": "हवेतील जादा दमटपणा व पानांवरील ओलावा यामुळे करप्याच्या बुरशीचा प्रादुर्भाव वाढून पानांवर गोल काळे डाग पडतात.",
                "what_to_do_now": [
                    "झाडाच्या खालच्या व जुन्या पानांवर काळे-तपकिरी गोलाकार डाग आहेत का ते तपासा.",
                    "जास्त बाधित झालेली पाने खुडून शेताबाहेर नेऊन सुरक्षित नष्ट करा.",
                    "ड्रीप सिंचनाचा वापर करा, जेणेकरून पानांवर पाण्याचा तुषार उडणार नाही.",
                ],
                "what_to_monitor": [
                    "पुढील ४८ तासांत लगतच्या प्लॉट व पट्ट्यांची पाहणी करा.",
                    "रात्रीच्या वेळी पानांवरील दव व ओलाव्याचा कालावधी तपासा.",
                ],
                "what_to_avoid": [
                    "संध्याकाळच्या वेळी स्प्रिंकलरने पाणी देणे टाळा.",
                    "अतिरिक्त युरिया खताचा वापर टाळावा.",
                ],
                "when_to_seek_expert_help": "रोगाचा फैलाव वरच्या पानांवर किंवा फळांवर दिसल्यास लगेच कृषी विस्तार अधिकारी पडताळणीची मागणी करा.",
                "safety_warnings": [
                    "केवळ अधिकृत कृषी विद्यापीठ शिफारशीत जैविक बुरशीनाशकांचाच वापर करा.",
                    "स्वतःहून तीव्र रासायनिक औषधांचा अंदाजे डोस फवारू नका.",
                ],
                "audio_text": "करपा रोग दक्षता सल्ला. झाडांची खालची पाने तपासा, पानावरील ओलावा टाळा आणि कृषी तज्ञांचा सल्ला घ्या.",
            },
        },
        "general_disease": {
            "en": {
                "title": "Crop Health & Pathogen Advisory",
                "summary": "Elevated agronomic risk detected in zone. Immediate scouting recommended.",
                "why_this_matters": "Environmental stress indicators match favorable disease sporulation conditions.",
                "what_to_do_now": [
                    "Conduct structured field scouting across affected zone.",
                    "Photograph suspicious symptoms and upload high-res images for expert validation.",
                    "Maintain field sanitation and clean farm equipment.",
                ],
                "what_to_monitor": ["Monitor canopy temperature and NDVI vegetative health index."],
                "what_to_avoid": ["Avoid touching healthy crops immediately after handling symptomatic plants."],
                "when_to_seek_expert_help": "Request extension officer validation if symptoms persist for more than 3 days.",
                "safety_warnings": ["Always practice Integrated Pest Management (IPM)."],
                "audio_text": "Crop health advisory active. Inspect affected zone and submit photos for expert validation.",
            },
            "ta": {
                "title": "பயிர் பாதுகாப்பு மற்றும் இடர் மேலாண்மை",
                "summary": "மண்டலத்தில் பயிர் நோய் அபாயம் கண்டறியப்பட்டுள்ளது. நேரடி கள ஆய்வு தேவை.",
                "why_this_matters": "தற்போதைய வானிலை காரணிகள் பயிர் நோய்க்கிருமிகள் வளர சாதகமாக உள்ளன.",
                "what_to_do_now": [
                    "பாதிக்கப்பட்ட மண்டலத்தில் நேரில் சென்று பயிர்களை உன்னிப்பாக கவனிக்கவும்.",
                    "தெளிவான புகைப்படங்களை எடுத்து நிபுணர் சரிபார்ப்புக்கு பதிவேற்றவும்.",
                    "பண்ணை கருவிகளை சுத்தமாக பராமரிக்கவும்.",
                ],
                "what_to_monitor": ["பயிர் வளர்ச்சி மற்றும் இலைகளின் பசுமை குறியீட்டை (NDVI) கண்காணிக்கவும்."],
                "what_to_avoid": ["பாதிக்கப்பட்ட செடிகளை தொட்டபின் உடனே ஆரோக்கியமான செடிகளை தொட வேண்டாம்."],
                "when_to_seek_expert_help": "அறிகுறிகள் 3 நாட்களுக்கு மேல் நீடித்தால் வேளாண் அலுவலரை தொடர்பு கொள்ளவும்.",
                "safety_warnings": ["ஒருங்கிணைந்த பயிர் பாதுகாப்பு (IPM) முறைகளை எப்போதும் பின்பற்றவும்."],
                "audio_text": "பயிர் பாதுகாப்பு எச்சரிக்கை. பாதிக்கப்பட்ட பயிர்களை ஆய்வு செய்து புகைப்படங்களை பதிவேற்றவும்.",
            },
            "hi": {
                "title": "फसल स्वास्थ्य एवं सुरक्षा परामर्श",
                "summary": "खेत के इस क्षेत्र में रोग जोखिम देखा गया है। तत्काल निरीक्षण की आवश्यकता है।",
                "why_this_matters": "मौसम के मौजूदा आंकड़े फसल पर कीट व रोग के अनुकूल परिस्थिति दर्शा रहे हैं।",
                "what_to_do_now": [
                    "प्रभावित क्षेत्र में जाकर पौधों की स्थिति का गहन निरीक्षण करें।",
                    "संदिग्ध लक्षणों की स्पष्ट फोटो खींचकर विशेषज्ञ समीक्षा के लिए भेजें।",
                    "कृषि उपकरणों की स्वच्छता का ध्यान रखें।",
                ],
                "what_to_monitor": ["पत्तियों के रंग और फसल के सामान्य स्वास्थ्य सूचकांक पर ध्यान दें।"],
                "what_to_avoid": ["रोगी पौधों को छूने के तुरंत बाद स्वस्थ पौधों को न छुएं।"],
                "when_to_seek_expert_help": "यदि लक्षण 3 दिनों से अधिक समय तक बने रहें तो कृषि विशेषज्ञ से संपर्क करें।",
                "safety_warnings": ["हमेशा एकीकृत कीट प्रबंधन (IPM) तकनीकों का पालन करें।"],
                "audio_text": "फसल सुरक्षा परामर्श। खेत की जाँच करें और विशेषज्ञ सत्यापन के लिए फोटो अपलोड करें।",
            },
            "mr": {
                "title": "पीक आरोग्य व कीड-रोग दक्षता सल्ला",
                "summary": "या पट्ट्यात पीक आरोग्यास धोका निर्माण होण्याची शक्यता आहे. त्वरित पाहणी करा.",
                "why_this_matters": "सध्याचे हवामान घटक पिकावर रोग निर्माण करणाऱ्या घटकांना पोषक आहेत.",
                "what_to_do_now": [
                    "बाधित क्षेत्रात जाऊन पिकाची सविस्तर पाहणी करा.",
                    "संशयास्पद पानांचे फोटो काढून कृषी तज्ञांच्या पडताळणीसाठी पाठवा.",
                    "शेतातील अवजारे स्वच्छ ठेवा.",
                ],
                "what_to_monitor": ["पिकाचा हिरवेगारपणा (NDVI) व पानांची वाढ नियमित तपासा."],
                "what_to_avoid": ["आजारी झाडांना स्पर्श केल्यानंतर लगेच चांगल्या झाडांना हात लावणे टाळा."],
                "when_to_seek_expert_help": "लक्षणे ३ दिवसांपेक्षा जास्त राहिल्यास कृषी सहाय्यकाची मदत घ्या.",
                "safety_warnings": ["नेहमी एकात्मिक कीड व्यवस्थापन (IPM) पद्धतींचा अवलंब करा."],
                "audio_text": "पीक आरोग्य सल्ला. शेतात जाऊन पाहणी करा आणि तज्ञ पडताळणीसाठी फोटो पाठवा.",
            },
        },
    }

    @classmethod
    def get_localized_content(
        cls,
        condition_key: str,
        target_language: str = "en",
        custom_replacements: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves localized advisory text with fallback to English if target language is missing.
        """
        lang = target_language if target_language in cls.SUPPORTED_LANGUAGES else cls.DEFAULT_LANGUAGE
        
        # Match key or default to general_disease
        template_group = cls.TEMPLATES.get(condition_key.lower().replace(" ", "_"), cls.TEMPLATES["general_disease"])
        
        is_fallback = False
        if lang not in template_group:
            content = template_group.get(cls.DEFAULT_LANGUAGE, cls.TEMPLATES["general_disease"]["en"])
            is_fallback = True
        else:
            content = template_group[lang]

        result = dict(content)
        result["is_fallback"] = is_fallback
        result["language"] = lang if not is_fallback else cls.DEFAULT_LANGUAGE

        # Apply safety checks: sanitize any unsupported dosage recipes
        result["what_to_do_now"] = [cls.sanitize_agronomic_action(a) for a in result.get("what_to_do_now", [])]
        result["safety_warnings"] = [cls.sanitize_agronomic_action(w) for w in result.get("safety_warnings", [])]

        return result

    @classmethod
    def sanitize_agronomic_action(cls, action_text: str) -> str:
        """Enforces IPM rule: never allow raw unsupported pesticide chemical dosages without guidance."""
        # Replace dangerous patterns like "20 ml per litre" with university approved safe phrasing
        if "ml per" in action_text.lower() or "gm per" in action_text.lower():
            return "Follow pesticide package label and locally approved Agricultural University dosage guidelines."
        return action_text
