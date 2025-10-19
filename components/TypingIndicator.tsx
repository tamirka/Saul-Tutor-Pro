import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <div className="typing-dot h-2 w-2 bg-gray-400 rounded-full"></div>
      <div className="typing-dot h-2 w-2 bg-gray-400 rounded-full"></div>
      <div className="typing-dot h-2 w-2 bg-gray-400 rounded-full"></div>
    </div>
  );
};

export default TypingIndicator;
