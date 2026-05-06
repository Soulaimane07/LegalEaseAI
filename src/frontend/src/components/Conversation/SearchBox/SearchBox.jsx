import React, { useState } from 'react'
import { IoIosSearch } from "react-icons/io";
import { auth } from "./firebase"; 
import { API_BASE_URL } from '../../variables';

function SearchBox({ handleSubmit, setDraft, onChatCreated, loadingState }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Combine parent sending state with local asset generation state
  const isProcessing = loading || loadingState;

  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && query.trim() !== "") {
      const targetText = query.trim();

      // --- CRITICAL CONDITIONAL CHECK FOR ONGOING MESSAGES ---
      // If handleSubmit is passed as a prop from Conversation.jsx, 
      // bypass the creation pipeline and append directly to data.id
      if (handleSubmit) {
        e.preventDefault();
        setQuery(""); // Instantly clear input for snappy user experience
        await handleSubmit(e, targetText);
        return; // Halt block propagation here
      }

      // --- FALLBACK: RUNS ON LANDING PAGE ONLY (NO ACTIVE CONVERSATION YET) ---
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          alert("Please sign in before starting a new consultation thread.");
          setLoading(false);
          return;
        }
        
        const token = await currentUser.getIdToken(true);
        const chatPayload = { title: targetText };

        // 1. Initialize the main conversation document container
        const chatResponse = await fetch(`${API_BASE_URL}/chat/new`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify(chatPayload),
        });

        if (!chatResponse.ok) throw new Error("HTTP error creating conversation container");
        const chatData = await chatResponse.json(); 
        const newConversationId = chatData.conversation_id;

        // 2. Atomically append the initial query as the very first chat message log
        const messagePayload = {
          role: "user",
          content: targetText,
          timestamp: new Date().toISOString()
        };

        const messageResponse = await fetch(`${API_BASE_URL}/chat/${newConversationId}/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(messagePayload)
        });

        if (!messageResponse.ok) throw new Error("Failed to append the initial chat message");

        // UI Cleanups
        setQuery(""); 
        if (setDraft) setDraft("");

        // Elevate the freshly verified thread document ID to change views automatically
        if (onChatCreated) {
          await onChatCreated(newConversationId);
        }
        
      } catch (error) {
        console.error("Failed to execute sequential chat generation pipeline:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`flex shadow items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6 transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}>
        <input 
          type="text" 
          className='w-full outline-none' 
          placeholder={isProcessing ? "Processing entry..." : "Ask LegalEase..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (setDraft) setDraft(e.target.value);
          }}
          onKeyDown={handleSearchSubmit} 
          disabled={isProcessing}
        />
        <IoIosSearch size={20} className={isProcessing ? "animate-pulse text-blue-500" : "text-gray-400"} />
    </div>
  )
}

export default SearchBox;