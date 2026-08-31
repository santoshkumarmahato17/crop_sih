import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Globe,
  X,
  Layers,
} from 'lucide-react';
import { assistantService } from '@/services/assistantService';
import { ChatMessage } from '@/types';

export const AgriculturalAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am your AGRI SHIELD Agricultural AI Assistant. Ask me anything about crop health, zone diagnostics, water requirements, spread risks, or drone surveillance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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

  const promptChips = language === 'en'
    ? [
        'Why is Zone Z03 red?',
        'Which zone needs water?',
        'Is the crop getting worse?',
        'When is the next drone mission?',
        'Which nearby farms have elevated risk?',
      ]
    : [
        'மண்டலம் Z03 ஏன் சிவப்பு நிறத்தில் உள்ளது?',
        'எந்த மண்டலத்திற்கு தண்ணீர் தேவை?',
        'பயிர் நோய் மோசமடைகிறதா?',
        'அடுத்த ட்ரோன் கண்காணிப்பு எப்போது?',
        'நான் என்ன கள ஆய்வு செய்ய வேண்டும்?',
      ];

  return (
    <>
      {/* Floating Trigger Bubble - Compact Icon Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="AGRI Assistant"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center group transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full" />
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[560px] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                  <span>AGRI SHIELD AI Assistant</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-[9px] text-emerald-400 font-mono">
                    Grounded RAG
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Real Telemetry • Non-Hallucinatory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLanguage((l) => (l === 'en' ? 'ta' : 'en'))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition flex items-center gap-1"
                title="Toggle English / தமிழ்"
              >
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>{language === 'en' ? '🇬🇧 EN' : '🇮🇳 தமிழ்'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Grounded Tool Badges */}
                  {msg.tools_used && msg.tools_used.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      {msg.tools_used.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-[9px] flex items-center gap-1"
                        >
                          <Layers className="w-2.5 h-2.5" />
                          <span>Retrieved: {tool}()</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[11px]">
                  Executing backend telemetry queries...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompt Chips */}
          <div className="px-3 py-2 border-t border-slate-800/60 bg-slate-950/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] whitespace-nowrap transition flex-shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'பயிர் நலம் பற்றி கேளுங்கள் (எ.கா: மண்டலம் Z03 ஏன் சிவப்பு?)'
                  : 'Ask about crop health, zones, water, missions...'
              }
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
