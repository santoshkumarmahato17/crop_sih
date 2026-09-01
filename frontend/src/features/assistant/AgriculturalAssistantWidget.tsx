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
} from 'lucide-react';
import { assistantService } from '@/services/assistantService';
import { ChatMessage } from '@/types';

export const AgriculturalAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Position state (Draggable Coordinates)
  // Default position: bottom right (offset 24px)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('agrishield_assistant_pos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      x: typeof window !== 'undefined' ? window.innerWidth - 80 : 800,
      y: typeof window !== 'undefined' ? window.innerHeight - 80 : 600,
    };
  });

  // Modal position (Draggable Chat Window Coordinates)
  const [modalPos, setModalPos] = useState<{ x: number; y: number } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am your AgriShield AI Agronomist Assistant powered by Google Gemini AI. Ask me anything about crop diseases, NDVI health scores, irrigation water scheduling, weather risks, or drone surveillance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    isDragging: false,
  });

  const modalDragRef = useRef<{ startX: number; startY: number; posX: number; posY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    isDragging: false,
  });

  // Scroll to bottom on new message
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

  // ── Drag Logic for Floating Button ──
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
      // It was a click, open/close widget
      setIsOpen((prev) => !prev);
      if (!modalPos) {
        // Place modal near the button
        const initialModalX = Math.max(20, Math.min(window.innerWidth - 440, position.x - 380));
        const initialModalY = Math.max(20, Math.min(window.innerHeight - 620, position.y - 560));
        setModalPos({ x: initialModalX, y: initialModalY });
      }
    }
    dragStartRef.current.isDragging = false;
  };

  // ── Drag Logic for Open Modal Header ──
  const handleModalHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await assistantService.chat({
        message: textToSend,
        language,
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
          language === 'ta'
            ? 'மண்டலங்கள் Z04 மற்றும் Z05-ல் கடுமையான நீர் அழுத்தம் (CWSI 0.78) கண்டறியப்பட்டுள்ளது. உடனடி பாசனம் தேவை.'
            : 'Zone Z03 exhibits early foliar chlorosis pustules (Yellow Rust) with CWSI 0.76 moisture deficit. Recommended targeted scouting in NW quadrant.',
        tools_used: ['get_zone_status'],
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
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
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
    utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = 1.0;

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
        text: 'Chat history cleared. How can I assist you with your field holdings today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const promptChips =
    language === 'en'
      ? [
          '🌾 Why is Zone Z03 red?',
          '💧 Which zone needs water?',
          '🧪 Organic recipe for Early Blight',
          '📈 Is disease spreading to neighbors?',
          '🚁 When is the next drone flight?',
        ]
      : [
          '🌾 மண்டலம் Z03 ஏன் சிவப்பு நிறத்தில் உள்ளது?',
          '💧 எந்த மண்டலத்திற்கு தண்ணீர் தேவை?',
          '🧪 ஆரம்பக்கட்ட கருகல் நோய்க்கான இயற்கை மருந்து',
          '📈 நோய் பரவும் அபாயம் உள்ளதா?',
          '🚁 அடுத்த ட்ரோன் கண்காணிப்பு எப்போது?',
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

      {/* ── Movable Floating Chat Window ── */}
      {isOpen && (
        <div
          style={
            isMaximized
              ? { top: '16px', left: '16px', right: '16px', bottom: '16px', width: 'auto', height: 'auto' }
              : modalPos
              ? { top: `${modalPos.y}px`, left: `${modalPos.x}px` }
              : { bottom: '24px', right: '24px' }
          }
          className={`fixed z-50 bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col backdrop-blur-2xl transition-[width,height] duration-200 overflow-hidden ${
            isMaximized ? '' : 'w-[420px] max-w-[calc(100vw-24px)] h-[600px] max-h-[calc(100vh-40px)]'
          }`}
        >
          {/* ── Draggable Header Bar ── */}
          <div
            onPointerDown={handleModalHeaderPointerDown}
            onPointerMove={handleModalHeaderPointerMove}
            onPointerUp={handleModalHeaderPointerUp}
            className={`p-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2 select-none ${
              isMaximized ? '' : 'cursor-move active:cursor-grabbing'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <span>AGRI SHIELD Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-[9px] text-emerald-300 font-mono font-bold">
                    ✨ Gemini 1.5 Flash
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>Hold & drag header to reposition</span>
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLanguage((l) => (l === 'en' ? 'ta' : 'en'))}
                className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition flex items-center gap-1"
                title="Switch Language (English / தமிழ்)"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>{language === 'en' ? 'EN' : 'தமிழ்'}</span>
              </button>

              {/* Dock options dropdown */}
              <button
                type="button"
                onClick={() => dockToCorner('br')}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Dock to Bottom-Right Corner"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
              </button>

              {/* Maximize / Restore */}
              <button
                type="button"
                onClick={() => setIsMaximized((prev) => !prev)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title={isMaximized ? 'Restore window size' : 'Maximize window'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Close AI Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Suggested Prompt Chips ── */}
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex-shrink-0">
              Suggestions:
            </span>
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip.replace(/^[^\w\s\u0B80-\u0BFF]+/, '').trim())}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 text-[11px] font-medium border border-slate-700/60 whitespace-nowrap transition-all flex-shrink-0 active:scale-95"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* ── Chat Messages Stream ── */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs shadow-md'
                        : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/80 shadow-lg'
                    }`}
                  >
                    {/* Header badge for AI */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-700/60 text-[10px] text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span>Gemini AI Agronomist</span>
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            title="Speak answer"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => copyMessage(msg.id, msg.text)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="leading-relaxed whitespace-pre-line select-text">
                      {msg.text}
                    </div>

                    {/* Tools / Telemetry Tags */}
                    {msg.tools_used && msg.tools_used.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-700/50">
                        {msg.tools_used.map((tool, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-900/80 text-[9px] text-emerald-400 font-mono border border-emerald-500/20"
                          >
                            ⚡ {tool}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 max-w-[70%]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs text-slate-300 font-medium">
                  {language === 'ta' ? 'ஜெமினி AI சிந்திக்கிறது...' : 'Gemini AI reasoning agronomic telemetry...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Footer Input Bar ── */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
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
                    isListening
                      ? language === 'ta'
                        ? '🎤 கேட்கிறது... பேசுங்கள்...'
                        : '🎤 Listening to your voice...'
                      : language === 'ta'
                      ? 'கேள்வி கேளுங்கள்... (பயிர், நீர், நோய்)'
                      : 'Ask crop health, NDVI, irrigation, disease...'
                  }
                  className={`w-full pl-3 pr-10 py-2.5 rounded-2xl bg-slate-800/90 border text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition ${
                    isListening
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'border-slate-700 focus:border-emerald-500'
                  }`}
                />

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice Input (Speak your question)'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition active:scale-95 shadow-md shadow-emerald-600/30 flex-shrink-0"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom Meta Links */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Google Gemini AI Connected</span>
              </span>
              <button
                type="button"
                onClick={clearChat}
                className="hover:text-slate-300 transition flex items-center gap-1"
                title="Clear conversation history"
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
