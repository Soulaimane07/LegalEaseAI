import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../../components/Conversation/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import StartConversation from '../../components/Conversation/StartConversation'
import ConversationComp from '../../components/Conversation/Conversation/Conversation'
import { API_BASE_URL } from '../../components/variables'

export default function Conversation() {
  const [conversations, setConversations] = useState([])
  const [conversation, setConversation] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Isolated reusable fetch utility to dynamically trigger component synchronizations
  const refreshHistory = useCallback(async (autoSelectId = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/all`)
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
      
      const data = await response.json()
      setConversations(data)
      
      // If an ID was provided, instantly select it to change the active view
      if (autoSelectId) {
        const targetChat = data.find(c => c.id === autoSelectId)
        if (targetChat) setConversation(targetChat)
      } else if (conversation) {
        // Keep the active thread up to date with new server-side message arrays
        const updatedChat = data.find(c => c.id === conversation.id)
        if (updatedChat) setConversation(updatedChat)
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    }
  }, [conversation])

  // Triggers history sync immediately on mount or user login change
  useEffect(() => {
    setLoading(true)
    refreshHistory().finally(() => setLoading(false))
  }, [user])


  return (
    <div>
      <Navbar setUserr={setUser} />

      <div className="h-screen bg-gray-100/50 items-stretch flex bg-bg px-20 py-12 pb-4 gap-6">
        
        {conversations.length > 0 && (
          <Sidebar 
            conversations={conversations} 
            currentConversation={conversation} 
            setConversation={setConversation} 
          />
        )}
        
        <div className="w-full mx-auto space-y-8 flex flex-col items-center justify-center">
          {!conversation ? (
            /* Pass down the callback so SearchBox can shift states on success */
            <StartConversation 
              user={user} 
              onChatCreated={refreshHistory} 
            />
          ) : (
            /* Pass refresh handler so ongoing chats append bubbles natively */
            <ConversationComp 
              data={conversation} 
              refreshChat={() => refreshHistory()} 
            />
          )}
        </div>
      </div>
    </div>
  )
}