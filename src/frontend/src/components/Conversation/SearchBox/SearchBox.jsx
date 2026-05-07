import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { useSelector, useDispatch } from 'react-redux';
import { createNewChat, sendMessage } from '../../../redux/slices/chatSlice';

function SearchBox({ setDraft }) {
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

  // Pull global states from Redux
  const { currentConversation, loading: chatLoading } = useSelector((state) => state.chat);
  const { status } = useSelector((state) => state.auth); // Accessing the central auth state
  
  const isProcessing = chatLoading;
  const isAuthenticated = status === 'authenticated';

  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && query.trim() !== "" && !isProcessing) {
      const targetText = query.trim();
      
      // 1. Instant UI feedback
      setQuery(""); 
      if (setDraft) setDraft("");

      // 2. Auth Check via Redux State
      if (!isAuthenticated) {
        alert("Please sign in before starting a LegalEase consultation.");
        return;
      }

      // 3. Logic Branching
      if (currentConversation?.id) {
        // CASE 1: Send message to existing thread
        dispatch(sendMessage({ 
          chatId: currentConversation.id, 
          content: targetText 
        }));
      } else {
        // CASE 2: Initialize a brand new legal consultation
        dispatch(createNewChat(targetText));
      }
    }
  };

  return (
    <div className={`flex shadow-sm items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6 transition-opacity border border-gray-100 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}>
        <input 
          type="text" 
          className='w-full outline-none text-gray-700 bg-transparent' 
          placeholder={isProcessing ? "LegalEase is processing..." : "Ask LegalEase..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (setDraft) setDraft(e.target.value);
          }}
          onKeyDown={handleSearchSubmit} 
          disabled={isProcessing}
        />
        <IoIosSearch 
          size={20} 
          className={isProcessing ? "animate-pulse text-blue-600" : "text-gray-400"} 
        />
    </div>
  );
}

export default SearchBox;