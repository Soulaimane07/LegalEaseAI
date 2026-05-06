import React, { useEffect, useRef } from 'react';
import SearchBox from '../SearchBox/SearchBox';
import { LuBot, LuUser } from "react-icons/lu"; // Accessible fallback avatars

function Conversation({ data }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom whenever data or chat history updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (data?.chat) {
      scrollToBottom();
    }
  }, [data?.chat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("add to chat");
  };

  // Safe fallback if data is null/empty when switching chats or starting a new one
  if (!data) {
    return (
      <div className='flex-1 h-[calc(100vh-48px)] bg-white border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 p-6 shadow-sm'>
        <LuBot size={40} className="mb-3 text-gray-300 animate-pulse" />
        <p className="text-sm font-medium">Select a conversation or start a new chat to begin.</p>
      </div>
    );
  }

  return (
    <div className='flex-1 w-full bg-white border border-gray-200/80 rounded-xl flex flex-col relative overflow-hidden'>
      
      {/* Sticky Top Header */}
      <header className='w-full px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10'>
        <h1 className='font-semibold text-gray-800 text-base truncate'>{data.title}</h1>
      </header>

      {/* Messages Scrollable Container */}
      <div className='flex-1 overflow-y-auto px-6 py-6 space-y-3 custom-scrollbar pb-32'>
        {data.chat?.map((message, index) => {
          const isUser = message.role === 'user';
          
          return (
            <div 
              key={index} 
              className={`flex items-start gap-3  max-w-2xl transition-all duration-200 ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Handling */}
              <div>
                {!isUser && (
                  <img 
                    src="/images/logo.png" 
                    alt="AI" 
                    className='w-6 h-6 mt-2.5'
                    onError={(e) => {
                      // Fallback icon if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>';
                    }}
                  />
                )}
              </div>

              {/* Chat Bubble */}
              <div className={`py-2.5 rounded-2xl text-[15px] leading-relaxed 
                ${isUser 
                  ? 'bg-gray-950 px-4 text-white  shadow-sm' 
                  : 'bg-gray-100/0 '
                }`}
              >
                <p className="whitespace-pre-line">{message.text}</p>
              </div>
            </div>
          );
        })}
        {/* Invisible anchor element to snap window to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Modern Input Wrapper */}
      <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 pointer-events-none'>
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <SearchBox handleSubmit={handleSubmit} />
        </div>
      </div>

    </div>
  );
}

export default Conversation;