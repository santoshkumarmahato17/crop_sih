import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation, SupportedLanguage } from '@/i18n';
import { advisoryService } from '@/services/advisoryService';

interface LanguageSwitcherProps {
  variant?: 'minimal' | 'full' | 'dropdown';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { currentLanguage, setLanguage, supportedLanguages } = useTranslation();

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    advisoryService.updateUserLanguage(code).catch(() => {});
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-1.5 bg-transparent p-0.5 rounded-full ${className}`}>
        {supportedLanguages.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#3f6e33] border border-[#569147] text-white font-semibold shadow-sm'
                  : 'text-[#8d7e84] hover:text-white hover:bg-[#241c20]'
              }`}
            >
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-surface-darkCard/90 border border-agri-200/50 dark:border-agri-700/25 shadow-sm backdrop-blur-md ${className}`}>
      <div className="pl-2 pr-1 text-agri-400/70">
        <Globe className="w-4 h-4 text-agri-600 dark:text-agri-400" />
      </div>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {supportedLanguages.map((lang) => {
          const isActive = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelectLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-900/20'
                  : 'text-agri-700 dark:text-agri-300 hover:bg-agri-50 dark:hover:bg-agri-800/60'
              }`}
            >
              <span>{lang.nativeName}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                isActive ? 'bg-white/20 text-emerald-100' : 'bg-slate-200 dark:bg-agri-800/50 text-agri-500/70'
              }`}>
                {lang.badge}
              </span>
              {isActive && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
