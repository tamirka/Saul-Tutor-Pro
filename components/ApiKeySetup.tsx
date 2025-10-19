import React, { useState } from 'react';

interface ApiKeySetupProps {
  onKeySelected: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeySelected }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('gemini-api-key', apiKey.trim());
      onKeySelected();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full animate-[slideUp_0.5s_ease-out]">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Welcome to AI Tutor Pro</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">Please enter your Google AI API key to continue. Your key is stored in your browser for this session only.</p>
        <div className="flex flex-col space-y-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
            placeholder="Enter your API Key"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
            aria-label="API Key Input"
          />
          <button
            onClick={handleSaveKey}
            disabled={!apiKey.trim()}
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg disabled:bg-indigo-400 dark:disabled:bg-indigo-800/50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          You can get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500">Google AI Studio</a>. For information on billing, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500">billing documentation</a>.
        </p>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default ApiKeySetup;
