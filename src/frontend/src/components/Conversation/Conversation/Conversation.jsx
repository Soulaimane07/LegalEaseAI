import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SearchBox from '../SearchBox/SearchBox';
import { LuBot, LuScale } from "react-icons/lu";
import MarkdownMessage from './MarkdownMessage';
import AnalysisPanel from './AnalysisPanel';
import { analyzeContract } from '../../../redux/slices/chatSlice';
import { openUpgrade } from '../../../redux/slices/authSlice';
import { LuCrown } from "react-icons/lu";

function Conversation() {
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const { currentConversation, loading, analysisLoading } = useSelector((state) => state.chat);
  const { profile } = useSelector((state) => state.auth);
  const hasDocument = currentConversation?.documents?.length > 0;
  const isPaid = profile && profile.subscription_plan !== 'freemium';

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
      <header className='w-full px-6 pb-1 flex items-center justify-between gap-3 shrink-0 z-10'>
        <div className="w-44 flex justify-start">
          {profile && (
            isPaid ? (
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-3 py-1.5 rounded-full">
                <LuCrown size={14} /> Pro · illimité
              </span>
            ) : (
              <button
                onClick={() => dispatch(openUpgrade())}
                className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                title="Passer au plan Pro"
              >
                {profile.analyses_remaining}/3 analyses gratuites
              </button>
            )
          )}
        </div>
        <h1 className='font-semibold text-xl text-gray-800 truncate text-center flex-1'>{currentConversation.title}</h1>
        <div className="w-44 flex justify-end">
          {hasDocument && (
            <button
              onClick={() => dispatch(analyzeContract({ chatId: currentConversation.id }))}
              disabled={analysisLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-sm transition-colors disabled:opacity-60"
              title="Analyser le contrat attaché (risques, obligations, recommandations)"
            >
              <LuScale size={16} />
              {analysisLoading ? 'Analyse…' : 'Analyser le contrat'}
            </button>
          )}
        </div>
      </header>

      <div className='flex-1 overflow-y-auto px-10 py-1 space-y-3 custom-scrollbar pb-32'>
        {currentConversation.messages?.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-2.5 transition-all duration-200 ${isUser ? 'ml-auto flex-row-reverse max-w-2xl' : 'mr-auto w-full max-w-3xl'}`}
            >
              {!isUser && (
                <img
                  src="/images/logo.png"
                  className="w-7 h-7 object-contain shrink-0 mt-1"
                  alt="LegalEase"
                />
              )}
              <div className={`rounded-2xl text-[15px] leading-relaxed
                ${isUser
                  ? 'bg-gray-950 px-4 py-2.5 text-white shadow-sm'
                  : 'bg-gray-50 border border-gray-100 px-4 py-3 text-gray-800 w-full'}`}
              >
                {isUser
                  ? <p className="whitespace-pre-line">{message.content}</p>
                  : <MarkdownMessage content={message.content} />}
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

      {/* Structured contract-analysis modal */}
      <AnalysisPanel />
    </div>
  );
}

export default Conversation;