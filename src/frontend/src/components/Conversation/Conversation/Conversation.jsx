import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import SearchBox from '../SearchBox/SearchBox';
import { LuBot } from "react-icons/lu";

function Conversation() {
  const messagesEndRef = useRef(null);
  const { currentConversation, loading } = useSelector((state) => state.chat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentConversation?.messages || loading) {
      scrollToBottom();
    }
  }, [currentConversation?.messages, loading]);

  if (!currentConversation) {
    return (
      <div className='flex-1 h-[calc(100vh-48px)] bg-white border border-gray-200/80 rounded-xl flex flex-col items-center justify-center text-gray-400 p-6 shadow-sm'>
        <LuBot size={40} className="mb-3 text-gray-300 animate-pulse" />
        <p className="text-sm font-medium">Select a conversation or start a new chat to begin.</p>
      </div>
    );
  }

  return (
    <div className='flex-1 w-full flex flex-col relative overflow-hidden h-full'>
      <header className='w-full px-6 pb-1 text-center backdrop-blur-md flex items-center justify-center shrink-0 z-10 '>
        <h1 className='font-semibold text-xl text-gray-800 '>{currentConversation.title}</h1>
      </header>

      <div className='flex-1 overflow-y-auto px-10 py-1 space-y-3 custom-scrollbar pb-32'>
        {currentConversation.messages?.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div 
              key={index} 
              className={`flex items-start gap-3 max-w-2xl transition-all duration-200 ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`py-2 flex gap-2 rounded-2xl text-[15px] leading-relaxed 
                ${isUser ? 'bg-gray-950 px-4 text-white shadow-sm' : 'bg-gray-50 px-1 text-gray-800'}`}
              >
                {!isUser && (
                  <img 
                    src="/images/logo.png" 
                    className="w-6 h-6 object-contain" 
                    alt="Logo" 
                  />
                )}
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          );
        })}

        {/* --- THINKING / LOADING STATE --- */}
        {loading && (
          <div className="flex items-start gap-2 mr-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className=" flex items-center gap-3">
              <img 
                src="/images/logo.png" 
                className='w-6 animate-spin' 
                style={{ 
                  animationDuration: '1.5s', 
                  animationTimingFunction: 'cubic-bezier(0.7, 0, 0.3, 1)' 
                }} 
                alt="Thinking..." 
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className='absolute bottom-0 left-0 right-0 pointer-events-none z-10'>
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <div className='z-20 pb-1 bg-gray-50'>
            <SearchBox /> 
          </div>
          <p className="text-xs z-10 text-center pt-2 bg-gray-50 text-gray-500">
            LegalEase is AI and can make mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Conversation;