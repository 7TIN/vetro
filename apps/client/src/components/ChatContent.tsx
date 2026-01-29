import React, { useRef, useEffect, useState } from 'react';
import { MessageCard } from './MessageCard';

// Define the shape of a message object
interface Message {
  id: number;
  userId: string;
  message: string;
}

const ChatContent = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const currentUser = "user1"; // Simulating the current logged-in user

  // Mock initial data
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, userId: "bot", message: "Hello! How can I help you code today?" },
    { id: 2, userId: "user1", message: "I need a React component." },
  ]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      userId: currentUser,
      message: inputValue
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    
    // Simulate a bot reply after 1 second
    setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now() + 1, userId: 'bot', message: "That sounds interesting!" }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-900 text-white p-3 font-bold text-sm">
        Assistant
      </div>

      {/* Message List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-neutral-50">
        {messages.map((msg) => (
          <MessageCard
            key={msg.id}
            type={msg.userId === currentUser ? "outgoing" : "incoming"}
            message={msg.message}
          />
        ))}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 rounded-md border border-neutral-300 focus:outline-none focus:border-neutral-500 text-sm font-mono text-black"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
            onClick={handleSend}
            className="bg-neutral-900 text-white px-3 py-1 rounded-md text-sm font-bold hover:bg-neutral-700"
        >
            Send
        </button>
      </div>
    </div>
  );
};

export default ChatContent;