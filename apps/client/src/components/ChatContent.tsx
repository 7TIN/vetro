import React, { useRef, useEffect, useState } from 'react';
import { MessageCard } from './MessageCard';

interface Message {
  id: number;
  userId: string;
  message: string;
}

const ChatContent = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, userId: "bot", message: "Hello! How can I help you?" },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now(), userId: "user", message: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 1. Call your API
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.message }),
      });

      const data = await response.json();

      // 2. Add Bot Response
      const botMsg: Message = { id: Date.now() + 1, userId: "bot", message: data.message };
      setMessages((prev) => [...prev, botMsg]);

    } catch (error) {
      console.error("Error fetching chat:", error);
      // Optional: Add an error message to chat
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-900 text-white p-3 font-bold text-sm">
        AI Assistant
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-neutral-50">
        {messages.map((msg) => (
          <MessageCard
            key={msg.id}
            type={msg.userId === "user" ? "outgoing" : "incoming"}
            message={msg.message}
          />
        ))}
        {isLoading && <div className="text-xs text-gray-400 pl-2">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-neutral-100 border-t border-neutral-200 flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 rounded-md border border-neutral-300 focus:outline-none text-sm font-mono text-black"
          placeholder="Type a message..."
          value={inputValue}
          disabled={isLoading}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={isLoading} className="bg-neutral-900 text-white px-3 py-1 rounded-md text-sm font-bold">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatContent;