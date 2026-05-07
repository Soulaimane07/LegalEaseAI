import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../../components/Conversation/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import StartConversation from '../../components/Conversation/StartConversation';
import ConversationComp from '../../components/Conversation/Conversation/Conversation';
import { fetchConversations } from '../../redux/slices/chatSlice';

export default function Conversation() {
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { conversations, currentConversation, loading } = useSelector((state) => state.chat);

  useEffect(() => {
    if (user) {
      dispatch(fetchConversations());
    }
  }, [user, dispatch]);

  const handleChatCreated = (newId) => {
    dispatch(fetchConversations(newId));
  };

  return (
    <div>
      <Navbar />

      <div className="h-screen bg-gray-100/50 items-stretch flex bg-bg px-20 py-12 pb-4 gap-6">
        
        {conversations.length > 0 && (<Sidebar />)}
        
        <div className="w-full mx-auto space-y-8 flex flex-col items-center justify-center">
          {loading && conversations.length === 0 ? (
             <div className="animate-pulse text-gray-400">Loading your history...</div>
          ) : !currentConversation ? (
            <StartConversation 
              user={user} 
              onChatCreated={handleChatCreated} 
            />
          ) : (
            <ConversationComp 
              data={currentConversation} 
              refreshChat={() => dispatch(fetchConversations())} 
            />
          )}
        </div>
      </div>
    </div>
  );
}