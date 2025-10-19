import React from 'react';

const AiThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-1 h-6">
      <div className="thinking-bar h-4 w-1 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
      <div className="thinking-bar h-4 w-1 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
      <div className="thinking-bar h-4 w-1 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
    </div>
  );
};

export default AiThinkingIndicator;
