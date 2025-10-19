import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TutorView from './components/TutorView';
import DashboardView from './components/DashboardView';
import LandingView from './components/LandingView';
import { Language, View, Theme } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import ApiKeySetup from './components/ApiKeySetup';

function App() {
  const [isApiKeyReady, setIsApiKeyReady] = useState(() => !!sessionStorage.getItem('gemini-api-key'));
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [language, setLanguage] = useLocalStorage<Language>('ai-tutor-language', Language.EN);
  const [theme, setTheme] = useLocalStorage<Theme>('ai-tutor-theme', 
    window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT
  );

  const handleKeySelected = () => {
    setIsApiKeyReady(true);
  };
  
  const resetApiKey = () => {
    sessionStorage.removeItem('gemini-api-key');
    setIsApiKeyReady(false);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.AR ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));
  };

  if (!isApiKeyReady) {
    return <ApiKeySetup onKeySelected={handleKeySelected} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.TUTOR:
        return <TutorView language={language} onApiKeyError={resetApiKey} />;
      case View.DASHBOARD:
        return <DashboardView language={language} setCurrentView={setCurrentView} />;
      case View.LANDING:
      default:
        return (
          <LandingView 
            setCurrentView={setCurrentView}
            language={language}
            setLanguage={setLanguage}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {currentView !== View.LANDING && (
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
