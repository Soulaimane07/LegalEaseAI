import React, { useEffect, useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom'; // UPDATED: Added useSearchParams
import { createNewChat, sendMessage } from '../../../redux/slices/chatSlice';

// Your live Stripe Payment Link (Lien de paiement)
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_fZueVc39c0HW04Ic3IdIA00";
const BACKEND_URL = "https://silver-fiesta-p5x6gpxv5w9c7p9r-8000.app.github.dev";

function SearchBox({ setDraft }) {
  const [query, setQuery] = useState("");
  const [isCapped, setIsCapped] = useState(false); 
  const [stripeLoading, setStripeLoading] = useState(false); 
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // NEW: Extracts parameters from URL string

  // Pull global states from Redux
  const { currentConversation, conversations, loading: chatLoading } = useSelector((state) => state.chat);
  
  // Extract token alongside user object from your auth slice
  const { user, token } = useSelector((state) => state.auth); 
  
  const isProcessing = chatLoading;
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

      if (!isAuthenticated) {
        alert("Please sign in before starting a LegalEase consultation.");
        return;
      }
      
      setQuery(""); 
      if (setDraft) setDraft("");

      if (currentConversation?.id) {
        dispatch(sendMessage({ 
          chatId: currentConversation.id, 
          content: targetText 
        }));
      } else {
        dispatch(createNewChat(targetText));
      }
    }
  };

  const handleUpgradeRedirect = () => {
    try {
      setStripeLoading(true);
      const customerEmail = user?.email ? `?prefilled_email=${encodeURIComponent(user.email)}` : '';
      window.location.href = `${STRIPE_PAYMENT_LINK}${customerEmail}`;
    } catch (error) {
      console.error("Redirection error:", error);
      alert("Failed to open payment page. Please try again.");
      setStripeLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Proactive Upgrade Warning */}
      {isCapped && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/70 backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-amber-900">Conversation Limit Reached (3/3)</span>
            <span className="text-xs text-amber-700">
              You've used all free consultation slots. Upgrade to Premium for unlimited access or delete an older conversation.
            </span>
          </div>
          <button 
            onClick={handleUpgradeRedirect}
            disabled={stripeLoading}
            className={`px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-full transition-colors shadow-sm shrink-0 whitespace-nowrap ${
              stripeLoading ? 'opacity-60 cursor-not-allowed animate-pulse' : ''
            }`}
          >
            {stripeLoading ? "Redirecting..." : "Upgrade Plan 🌟"}
          </button>
        </div>
      )}

      {/* Input Box Layout Wrapper */}
      <div 
        className={`flex shadow-sm items-center gap-3 bg-white rounded-lg px-6 py-4 pb-6 transition-all border border-gray-100 ${
          isProcessing || isCapped ? 'opacity-50 bg-gray-50/50 cursor-not-allowed' : 'opacity-100'
        }`}
      >
          <input 
            type="text" 
            className="w-full outline-none text-gray-700 bg-transparent disabled:cursor-not-allowed" 
            placeholder={
              isProcessing 
                ? "LegalEase is processing..." 
                : isCapped 
                ? "Please upgrade your plan to start a new chat..." 
                : "Ask LegalEase..."
            }
            value={query}
            onChange={(e) => {
              if (isCapped) return; 
              setQuery(e.target.value);
              if (setDraft) setDraft(e.target.value);
            }}
            onKeyDown={handleSearchSubmit} 
            disabled={isProcessing || isCapped} 
          />
          <IoIosSearch 
            size={20} 
            className={isProcessing ? "animate-pulse text-blue-600" : "text-gray-400"} 
          />
      </div>
    </div>
  );
}

export default SearchBox;