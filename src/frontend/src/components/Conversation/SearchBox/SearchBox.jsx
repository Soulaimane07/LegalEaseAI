import React, { useState, useRef } from 'react';
import { IoIosSearch } from "react-icons/io";
import { LuPaperclip } from "react-icons/lu";
import { useSelector, useDispatch } from 'react-redux';
import { createNewChat, sendMessage, attachDocument } from '../../../redux/slices/chatSlice';

function SearchBox({ setDraft }) {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  // Pull global states from Redux
  const { currentConversation, loading: chatLoading } = useSelector((state) => state.chat);
  const { status } = useSelector((state) => state.auth); // Accessing the central auth state

  const isProcessing = chatLoading || uploading;
  const isAuthenticated = status === 'succeeded';

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
        dispatch(sendMessage({ chatId: currentConversation.id, content: targetText }));
      } else {
        dispatch(createNewChat(targetText));
      }
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!isAuthenticated) {
      alert("Please sign in before attaching a document.");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Merci de sélectionner un fichier PDF.");
      return;
    }

    setUploading(true);
    try {
      const result = await dispatch(attachDocument(file));
      if (attachDocument.rejected.match(result)) {
        alert(result.payload || "Échec de l'envoi du document.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`flex shadow-sm items-center gap-3 bg-white rounded-lg px-4 py-4 pb-6 transition-opacity border border-gray-100 ${isProcessing ? 'opacity-60' : 'opacity-100'}`}>
        {/* Hidden file input driven by the paperclip button */}
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          title="Joindre un PDF pour en discuter avec l'IA"
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          disabled={isProcessing}
          className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
        >
          <LuPaperclip size={20} className={uploading ? "animate-pulse text-blue-600" : ""} />
        </button>

        <input
          type="text"
          className='w-full outline-none text-gray-700 bg-transparent'
          placeholder={uploading ? "Téléchargement du document..." : (chatLoading ? "LegalEase is processing..." : "Ask LegalEase...")}
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
