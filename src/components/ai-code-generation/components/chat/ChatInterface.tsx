'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, image?: File | null) => void;
  isLoading: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
}

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  isLoading,
  onCollapseToggle 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Desplazamiento automático al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    if (onCollapseToggle) {
      onCollapseToggle(newCollapsedState);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 text-white">
        <div className="text-sm font-medium">Chat IA</div>
        <button 
          onClick={toggleCollapse} 
          className="p-1 rounded hover:bg-gray-700"
          aria-label={isCollapsed ? "Expandir chat" : "Colapsar chat"}
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-800">
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4">
            <MessageInput 
              onSendMessage={(message, image) => onSendMessage(message, image)} 
              isLoading={isLoading} 
            />
          </div>
        </>
      )}
    </div>
  );
}