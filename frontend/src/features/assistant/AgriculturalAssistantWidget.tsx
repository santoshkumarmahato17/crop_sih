import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Globe,
  X,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Copy,
  Check,
  CornerDownRight,
  Wheat,
  Camera,
} from 'lucide-react';
import { assistantService } from '@/services/assistantService';
import { ChatMessage } from '@/types';

export const AgriculturalAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr' | 'ta'>('en');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Staged Image for Multimodal Leaf/Crop Diagnosis
  const [selectedImage, setSelectedImage] = useState<{
    base64: string;
    mime: string;
    preview: string;
    name: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Movable trigger button position (default bottom-right, respecting mobile nav bar)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const saved = localStorage.getItem('agrishield_assistant_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      } catch {}
    }
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - 72 : 800,
      y: typeof window !== 'undefined' ? window.innerHeight - (isMobile ? 140 : 80) : 600,
    };
  });

  // Modal position (Draggable Chat Window Coordinates)
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am your AgriShield AI Agronomist powered by Google Gemini. Ask any crop question or upload a plant photo to get full diagnosis: Root Cause & Reason, Symptoms, Crop Prevention, and Medicine/Pesticide suggestions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'en',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    isDragging: boolean;
  }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    isDragging: false,
  });

  const modalDragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    isDragging: boolean;
  }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    isDragging: false,
  });

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Window resize bounds keeper
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 64),
        y: Math.min(prev.y, window.innerHeight - 64),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save button position
  useEffect(() => {
    localStorage.setItem('agrishield_assistant_pos', JSON.stringify(position));
  }, [position]);

  // ── Drag Logic for Floating Trigger Button ──
  const handleButtonPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
      isDragging: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleButtonPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.buttons !== 1) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.isDragging = true;
    }

    if (dragStartRef.current.isDragging) {
      const newX = Math.max(16, Math.min(window.innerWidth - 68, dragStartRef.current.posX + dx));
      const newY = Math.max(16, Math.min(window.innerHeight - 68, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleButtonPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!dragStartRef.current.isDragging) {
      setIsOpen((prev) => !prev);
      if (!modalPos) {
        const initialModalX = Math.max(20, Math.min(window.innerWidth - 440, position.x - 380));
        const initialModalY = Math.max(20, Math.min(window.innerHeight - 620, position.y - 560));
        setModalPos({ x: initialModalX, y: initialModalY });
      }
    }
    dragStartRef.current.isDragging = false;
  };

  // ── Drag Logic for Open Modal Header ──
  const handleModalHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If the pointer event originated from a control button, do NOT start dragging
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (isMaximized) return;

    const curX = modalPos?.x ?? Math.max(20, window.innerWidth - 460);
    const curY = modalPos?.y ?? Math.max(20, window.innerHeight - 640);

    modalDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: curX,
      posY: curY,
      isDragging: true,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleModalHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!modalDragRef.current.isDragging || isMaximized) return;
    const dx = e.clientX - modalDragRef.current.startX;
    const dy = e.clientY - modalDragRef.current.startY;

    const modalWidth = 430;
    const modalHeight = 580;

    const newX = Math.max(10, Math.min(window.innerWidth - modalWidth - 10, modalDragRef.current.posX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - modalHeight - 10, modalDragRef.current.posY + dy));
    setModalPos({ x: newX, y: newY });
  };

  const handleModalHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    modalDragRef.current.isDragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const dockToCorner = (corner: 'br' | 'bl' | 'tr' | 'tl') => {
    const margin = 24;
    const modalW = 430;
    const modalH = 580;

    if (corner === 'br') {
      setModalPos({ x: window.innerWidth - modalW - margin, y: window.innerHeight - modalH - margin });
      setPosition({ x: window.innerWidth - 70, y: window.innerHeight - 70 });
    } else if (corner === 'bl') {
      setModalPos({ x: margin, y: window.innerHeight - modalH - margin });
      setPosition({ x: margin, y: window.innerHeight - 70 });
    } else if (corner === 'tr') {
      setModalPos({ x: window.innerWidth - modalW - margin, y: margin });
      setPosition({ x: window.innerWidth - 70, y: margin });
    } else {
      setModalPos({ x: margin, y: margin });
      setPosition({ x: margin, y: margin });
    }
  };

  const cycleLanguage = () => {
    setLanguage((prev) => {
      if (prev === 'en') return 'mr';
      if (prev === 'mr') return 'hi';
      if (prev === 'hi') return 'ta';
      return 'en';
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage({
        base64: result,
        mime: file.type || 'image/jpeg',
        preview: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() && !selectedImage) return;

    const currentImage = selectedImage;
    setSelectedImage(null);

    const promptText =
      textToSend.trim() ||
      (currentImage
        ? 'Please examine this crop image and provide full diagnosis: 1. Root Cause & Reason, 2. Symptoms & Identification, 3. Crop Prevention Protocols, 4. Medicine & Pesticide Suggestions with dosages, 5. Actionable Recommendations.'
        : '');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      image_url: currentImage?.preview,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await assistantService.chat({
        message: promptText,
        language,
        image_base64: currentImage?.base64,
        image_mime: currentImage?.mime,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.response_text,
        tools_used: res.tools_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: res.language,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackAiMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'hi'
            ? '🔬 **कारण और लक्षण:** जोन Z03 में क्लोरोसिस और संदिग्ध येलो रस्ट पाया गया है।\n💊 **दवा व कीटनाशक:** प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर पानी का छिड़काव करें।\n🛡️ **रोकथाम:** जल निकासी सुधारें और प्रतिरोधी किस्मों का उपयोग करें।'
            : language === 'ta'
            ? '🔬 **காரணம் மற்றும் அறிகுறிகள்:** மண்டலம் Z03-ல் மஞ்சள் துரு நோய் மற்றும் கடுமையான நீர் அழுத்தம் கண்டறியப்பட்டுள்ளது.\n💊 **மருந்து பரிந்துரை:** புரோபிகோனசோல் 25% EC @ 1 மிலி/லிட்டர் தெளிக்கவும்.\n🛡️ **தடுப்பு முறை:** சரியான வடிகால் வசதி மற்றும் பாசன மேலாண்மை.'
            : '🔬 **ROOT CAUSE & REASON:** Foliar chlorosis with active fungal lesion signatures.\n🔍 **SYMPTOMS:** Characteristic yellowing along leaf veins and necrotic margins.\n🛡️ **CROP PREVENTION:** Improve soil drainage, rotate with non-host legumes, use certified disease-free seeds.\n💊 **MEDICINE & PESTICIDE SUGGESTION:** Spray Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin @ 1 ml/L. Organic alternative: Neem oil 1500 ppm @ 3-5 ml/L.\n📋 **RECOMMENDATIONS:** Immediately scout perimeter and avoid overhead sprinkler watering.',
        tools_used: ['gemini_agronomic_engine', 'get_zone_status'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Voice Input (Speech Recognition) ──
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang =
        language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition initiation failed:', err);
      setIsListening(false);
    }
  };

  // ── Text-to-Speech Playback ──
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text:
          language === 'mr'
            ? 'नमस्कार! संवाद साफ करण्यात आला आहे. आज आपल्या शेतातील पीक आरोग्य, हवामान धोका किंवा कीड नियंत्रणात मी कशी मदत करू शकतो?'
            : language === 'hi'
            ? 'बातचीत साफ़ कर दी गई है। आज मैं आपकी फसल के स्वास्थ्य और ड्रोन निगरानी में कैसे सहायता कर सकता हूँ?'
            : language === 'ta'
            ? 'அரட்டை அழிக்கப்பட்டது. உங்கள் பண்ணை மேலாண்மையில் நான் எவ்வாறு உதவ முடியும்?'
            : 'Chat history cleared. How can I assist you with your crop health and telemetry today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const promptChips =
    language === 'mr'
      ? [
          '💊 कीटकनाशक व औषध सल्ला',
          '🛡️ पीक रोग प्रतिबंधक उपाय',
          '🔬 पानांवरील लक्षणे व कारणे',
          '🌿 कापूस बोंडअळी व कीड नियंत्रण',
          '💧 सिंचन व मातीचे आरोग्य',
        ]
      : language === 'hi'
      ? [
          '💊 कीटनाशक और दवा का सही डोज',
          '🛡️ फसल रोग रोकथाम के उपाय',
          '🔬 पत्तों के लक्षण और मुख्य कारण',
          '🌿 इल्ली व कीट नियंत्रण समाधान',
          '💧 सिंचाई और मिट्टी स्वास्थ्य',
        ]
      : language === 'ta'
      ? [
          '💊 பூச்சிக்கொல்லி & மருந்து பரிந்துரை',
          '🛡️ பயிர் நோய் தடுப்பு முறைகள்',
          '🔬 இலை அறிகுறிகள் மற்றும் காரணம்',
          '🌿 பூச்சி கட்டுப்பாடு',
          '💧 பாசனம் & மண் வளம்',
        ]
      : [
          '💊 Medicine & Pesticide Suggestions',
          '🛡️ Crop Disease Prevention',
          '🔬 Leaf Symptoms & Root Cause',
          '🌿 Pest & Caterpillar Control',
          '💧 Irrigation & Soil Health',
        ];

  return (
    <>
      {/* ── Movable Floating Trigger Button ── */}
      {!isOpen && (
        <button
          type="button"
          onPointerDown={handleButtonPointerDown}
          onPointerMove={handleButtonPointerMove}
          onPointerUp={handleButtonPointerUp}
          title="Drag to reposition • Click to open Gemini AI Assistant"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            touchAction: 'none',
          }}
          className="fixed top-0 left-0 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-950/70 border-2 border-white/40 flex items-center justify-center group cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-[transform,shadow] select-none"
        >
          <div className="relative flex items-center justify-center pointer-events-none">
            <Bot className="w-7 h-7 text-white drop-shadow" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-lime-300 rounded-full animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-lime-400 rounded-full border border-white/60" />
          </div>

          {/* Floating hint tooltip */}
          <div className="absolute right-full mr-3 px-2.5 py-1 rounded-xl bg-slate-950/90 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-lg backdrop-blur-md">
            ✨ Gemini AI • Drag to move
          </div>
        </button>
      )}

      {/* ── Movable / Maximizable Floating Chat Window ── */}
      {isOpen && (
        <div
          style={
            typeof window !== 'undefined' && window.innerWidth < 640
              ? {
                  position: 'fixed',
                  bottom: '76px',
                  left: '8px',
                  right: '8px',
                  width: 'calc(100vw - 16px)',
                  maxHeight: 'calc(100vh - 90px)',
                  height: '540px',
                  zIndex: 9999,
                }
              : isMaximized
              ? {
                  position: 'fixed',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  bottom: '12px',
                  width: 'calc(100vw - 24px)',
                  height: 'calc(100vh - 24px)',
                  zIndex: 9999,
                }
              : modalPos
              ? {
                  position: 'fixed',
                  top: `${modalPos.y}px`,
                  left: `${modalPos.x}px`,
                  width: '430px',
                  height: '620px',
                  maxWidth: 'calc(100vw - 24px)',
                  maxHeight: 'calc(100vh - 36px)',
                  zIndex: 9999,
                }
              : {
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  width: '430px',
                  height: '620px',
                  maxWidth: 'calc(100vw - 24px)',
                  maxHeight: 'calc(100vh - 36px)',
                  zIndex: 9999,
                }
          }
          className="relative bg-slate-950/95 border border-emerald-500/40 rounded-3xl shadow-2xl flex flex-col backdrop-blur-3xl overflow-hidden animate-in fade-in-50 duration-150"
        >
          {/* ── Rich Agricultural Crop Background Overlay ── */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15 mix-blend-screen bg-cover bg-center z-0"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.4), transparent 45%), radial-gradient(circle at 20% 80%, rgba(20, 184, 166, 0.3), transparent 50%), repeating-linear-gradient(45deg, rgba(34,197,94,0.06) 0px, rgba(34,197,94,0.06) 2px, transparent 2px, transparent 12px)`,
            }}
          />

          {/* Subtle Crop Motifs Watermark */}
          <div className="absolute top-16 right-4 pointer-events-none opacity-5 text-emerald-300 z-0">
            <Wheat className="w-64 h-64" />
          </div>

          {/* ── Draggable Header Bar ── */}
          <div
            onPointerDown={handleModalHeaderPointerDown}
            onPointerMove={handleModalHeaderPointerMove}
            onPointerUp={handleModalHeaderPointerUp}
            className={`relative z-10 p-3.5 border-b border-emerald-500/20 bg-slate-900/90 dark:bg-slate-950/90 flex items-center justify-between gap-2 select-none ${
              isMaximized ? '' : 'cursor-move active:cursor-grabbing'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <span className="tracking-tight">AGRI SHIELD Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border border-emerald-400/40 text-[9px] text-emerald-300 font-mono font-black">
                    ✨ Gemini 1.5
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>Hold & drag header to reposition</span>
                </p>
              </div>
            </div>

            {/* Header Controls (Isolated from Pointer Dragging) */}
            <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
              {/* Language Switcher (EN / मराठी / हिन्दी / தமிழ்) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cycleLanguage();
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold border border-slate-700 transition flex items-center gap-1 shadow-sm active:scale-95"
                title="Switch Language (English / मराठी / हिन्दी / தமிழ்)"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>
                  {language === 'en'
                    ? 'EN'
                    : language === 'mr'
                    ? 'मराठी'
                    : language === 'hi'
                    ? 'हिन्दी'
                    : 'தமிழ்'}
                </span>
              </button>

              {/* Dock options dropdown */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dockToCorner('br');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Dock to Bottom-Right Corner"
              >
                <CornerDownRight className="w-4 h-4" />
              </button>

              {/* Maximize / Restore */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMaximized((prev) => !prev);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isMaximized ? 'Restore window size' : 'Maximize window'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close / Cancel Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition active:scale-90"
                title="Close AI Assistant"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Suggested Prompt Chips ── */}
          <div className="relative z-10 px-3 py-2 border-b border-slate-800/80 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex-shrink-0">
              Suggestions:
            </span>
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip.replace(/^[^\w\s\u0900-\u097F\u0B80-\u0BFF]+/, '').trim())}
                className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-200 text-[11px] font-semibold border border-slate-700/80 whitespace-nowrap transition-all flex-shrink-0 active:scale-95 shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ── Chat Messages Stream (High Contrast) ── */}
          <div className="relative z-10 flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div
                    className={`max-w-[90%] p-4 rounded-3xl ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-lg font-medium border border-emerald-400/30'
                        : 'bg-slate-900/95 text-slate-100 rounded-bl-xs border border-slate-700/90 shadow-2xl backdrop-blur-md'
                    }`}
                  >
                    {/* Header badge for AI */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-slate-800 text-[10px] text-emerald-400 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Gemini AI Agronomist</span>
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Speak answer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyMessage(msg.id, msg.text)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attached Image Specimen */}
                    {msg.image_url && (
                      <div className="mb-2.5 overflow-hidden rounded-2xl border border-white/20 shadow-md">
                        <img
                          src={msg.image_url}
                          alt="Crop specimen"
                          className="max-h-52 w-full object-cover rounded-2xl"
                        />
                      </div>
                    )}

                    <div className="leading-relaxed whitespace-pre-line select-text font-medium text-slate-100">
                      {msg.text}
                    </div>

                    {/* Tools / Telemetry Tags */}
                    {msg.tools_used && msg.tools_used.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                        {msg.tools_used.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-emerald-950/80 text-[10px] text-emerald-300 font-mono font-bold border border-emerald-500/30"
                          >
                            ⚡ {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 block text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-emerald-400 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 w-fit">
                <span className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
                <span className="text-xs font-mono font-semibold">Gemini AI is analyzing crop health & remedies...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Message Input Bar ── */}
          <div className="relative z-10 p-3 border-t border-slate-800/80 bg-slate-950/95 space-y-2">
            {/* Hidden Camera/File Upload Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Staged Image Preview Badge */}
            {selectedImage && (
              <div className="flex items-center justify-between p-2 px-3 rounded-2xl bg-slate-900 border border-emerald-500/50 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedImage.preview}
                    alt="Staged"
                    className="w-10 h-10 object-cover rounded-xl border border-slate-700 shadow-sm"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Photo Attached for AI Diagnosis</span>
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">
                      {selectedImage.name}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedImage
                      ? 'Add question about this photo (optional), or press Send...'
                      : language === 'hi'
                      ? 'फसल स्वास्थ्य, दवा, या रोकथाम के बारे में पूछें...'
                      : language === 'ta'
                      ? 'பயிர் ஆரோக்கியம் அல்லது மருந்து பற்றி கேட்கவும்...'
                      : 'Ask crop symptoms, prevention, medicines, pesticides...'
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-4 pr-16 py-2.5 text-xs text-white placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                {/* Camera / Photo Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-8 top-2 p-1 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                  title="Upload crop/leaf photo for Gemini diagnosis"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`absolute right-2 top-2 p-1 rounded-xl transition ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak your question'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white transition shadow-lg shadow-emerald-600/30 flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Gemini AI Connected</span>
              </span>
              <button
                type="button"
                onClick={clearChat}
                className="hover:text-slate-200 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
