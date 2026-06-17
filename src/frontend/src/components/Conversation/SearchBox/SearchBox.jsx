import React, { useState, useRef } from 'react';
import { IoIosSearch } from "react-icons/io";
import { LuPaperclip } from "react-icons/lu";
import { useSelector, useDispatch } from 'react-redux';
import { createNewChat, sendMessage, attachDocument } from '../../../redux/slices/chatSlice';

function SearchBox({ setDraft }) {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [isCapped, setIsCapped] = useState(false); 
  const [stripeLoading, setStripeLoading] = useState(false); 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // NEW: Extracts parameters from URL string

  // Pull global states from Redux
  const { currentConversation, conversations, loading: chatLoading } = useSelector((state) => state.chat);
  
  // Extract token alongside user object from your auth slice
  const { user, token } = useSelector((state) => state.auth); 

  const isProcessing = chatLoading || uploading;
  const isAuthenticated = user;

  // NEW: Watch for a successful payment redirect query parameter
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus === 'success' && isAuthenticated && token) {
      // Execute background patch to transform tier structure to 'subscribed'
      fetch(`${BACKEND_URL}/api/user/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: 'subscribed' }) // NEW: Target payload type string
      })
      .then((res) => {
        if (!res.ok) throw new Error("Database correction error handling verification request.");
        return res.json();
      })
      .then(() => {
        alert("🎉 Thank you! Your account has been updated to Subscribed status.");
        // Redirect cleanly to drop the query strings from address bar
        navigate('/dashboard', { replace: true });
        window.location.reload(); // Reload to force refresh auth state data across slices
      })
      .catch((err) => console.error("Plan upgrade hook failure:", err));
    }
  }, [searchParams, isAuthenticated, token, navigate]);

  // UPDATED: Limit verification condition to account for 'subscribed'
  useEffect(() => {
    const isNewChat = !currentConversation?.id;
    
    // User is capped ONLY if they are explicitly on 'freemium' and already have 3 or more chats
    if (isAuthenticated && user?.plan === 'freemium' && isNewChat && conversations.length >= 3) {
      setIsCapped(true);
    } else {
      setIsCapped(false);
    }
  }, [currentConversation, conversations, user, isAuthenticated]);

  const handleSearchSubmit = async (e) => {
    if (isCapped) return;

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
      
      setQuery(""); 
      if (setDraft) setDraft("");

      if (currentConversation?.id) {
        dispatch(sendMessage({ chatId: currentConversation.id, content: targetText }));
      } else {
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
