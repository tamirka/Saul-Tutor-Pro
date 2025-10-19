import React from 'react';
import { Language, View, Theme } from '../types';
import { TEXTS } from '../constants';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, language, setLanguage, theme, toggleTheme }) => {
  const texts = TEXTS[language];
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{texts.title}</h1>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <nav className="hidden md:flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
              <button
                onClick={() => setCurrentView(View.TUTOR)}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  currentView === View.TUTOR ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {texts.tutor}
              </button>
              <button
                onClick={() => setCurrentView(View.DASHBOARD)}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  currentView === View.DASHBOARD ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {texts.dashboard}
              </button>
            </nav>
            <div className="relative">
              <select 
                value={language} 
                onChange={handleLanguageChange} 
                className="appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full py-1 ps-3 pe-8 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={texts.language}
              >
                <option value={Language.EN}>English</option>
                <option value={Language.AR}>العربية</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === Theme.LIGHT ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="md:hidden flex justify-center pb-2">
            <nav className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
              <button
                onClick={() => setCurrentView(View.TUTOR)}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  currentView === View.TUTOR ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {texts.tutor}
              </button>
              <button
                onClick={() => setCurrentView(View.DASHBOARD)}
                className={`px-4 py-1 text-sm font-medium rounded-full transition-colors ${
                  currentView === View.DASHBOARD ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {texts.dashboard}
              </button>
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
