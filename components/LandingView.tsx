import React, { useState } from 'react';
import { Language, View, Theme } from '../types';
import { TEXTS } from '../constants';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface LandingViewProps {
  setCurrentView: (view: View) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const SettingsModal: React.FC<Omit<LandingViewProps, 'setCurrentView'>> = ({ language, setLanguage, theme, toggleTheme }) => {
  const texts = TEXTS[language];
  const isDark = theme === Theme.DARK;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{texts.settingsTitle}</h2>
      
      {/* Language Setting */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{texts.language}</label>
        <div className="relative">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)} 
            className="appearance-none w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 ps-3 pe-8 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={Language.EN}>English</option>
            <option value={Language.AR}>العربية</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {/* Theme Setting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{texts.theme}</label>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button onClick={() => !isDark && toggleTheme()} className={`w-full flex justify-center items-center space-x-2 rounded-md p-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400' : 'bg-white text-indigo-600 shadow'}`}>
            <SunIcon className="w-5 h-5"/>
            <span>{texts.light}</span>
          </button>
          <button onClick={() => isDark && toggleTheme()} className={`w-full flex justify-center items-center space-x-2 rounded-md p-2 text-sm font-medium transition-colors ${!isDark ? 'text-gray-400' : 'bg-gray-900/50 text-indigo-300 shadow'}`}>
            <MoonIcon className="w-5 h-5"/>
            <span>{texts.dark}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const LandingView: React.FC<LandingViewProps> = ({ setCurrentView, language, setLanguage, theme, toggleTheme }) => {
  const texts = TEXTS[language];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-600 p-4 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <BrainCircuitIcon className="w-24 h-24 text-indigo-200 animate-pulse"/>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tighter">
          {texts.welcomeTitle}
        </h1>
        <p className="max-w-xl md:text-lg text-indigo-100 mb-8">
          Your personal AI-powered partner for mastering any subject through interactive conversation.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => setCurrentView(View.TUTOR)}
            className="w-full sm:w-auto bg-white text-indigo-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-indigo-50 transition-transform hover:scale-105 shadow-lg"
          >
            {texts.startLearningBtn}
          </button>
          <button 
            onClick={() => setCurrentView(View.DASHBOARD)}
            className="w-full sm:w-auto bg-white/20 backdrop-blur-md text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white/30 transition-transform hover:scale-105 shadow-lg"
          >
            {texts.viewDashboardBtn}
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full sm:w-auto bg-transparent border-2 border-white/50 text-white/80 font-bold py-3 px-8 rounded-full text-lg hover:bg-white/20 hover:text-white transition-colors shadow-lg"
          >
            {texts.settingsBtn}
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 transition-opacity animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
             <button onClick={() => setIsSettingsOpen(false)} className="absolute -top-3 -end-3 z-50 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-transform hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            <SettingsModal 
              language={language}
              setLanguage={setLanguage}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default LandingView;