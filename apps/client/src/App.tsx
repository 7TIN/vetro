import React, { useState, useEffect } from 'react';
import Card from './components/Card'; 
import ChatContent from './components/ChatContent';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      window.parent.postMessage({ type: 'CHAT_RESIZE', width: '400px', height: '600px' }, '*');
    } else {
      window.parent.postMessage({ type: 'CHAT_RESIZE', width: '80px', height: '80px' }, '*');
    }
  }, [isOpen]);

  return (
    <div className="h-full w-full flex flex-col items-end justify-end gap-4 pointer-events-none">
      
      {isOpen && (
        <Card className="flex-1 w-full pointer-events-auto">
           <ChatContent />
        </Card>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto h-14 w-14 bg-neutral-900 hover:bg-neutral-800 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200"
      >
        {isOpen ? (
          // Close Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Chat Icon
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default App;