import { useState } from 'react'
import Sidebar from '../../components/Conversation/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import StartConversation from '../../components/Conversation/StartConversation'
import ConversationComp from '../../components/Conversation/Conversation/Conversation'

export default function Conversation() {
  const [conversations, setConversations] = useState([])
  const [conversation, setConversation] = useState(null)
  const [draft, setDraft] = useState('')

  const [user, setUser] = useState(null)


  const handleSubmit = (event) => {
    event.preventDefault()

    setConversations((prev) => [
      ...prev,
      { title: 'Conversation ' + (conversations.length +  1), chat: [{ role: 'user', text: "Question " + (conversations.length +  1) }, { role: 'assistant', text: "Answer " + (conversations.length +  1) }] },
    ])

    setDraft('')
  }


  // { role: 'user', text: draft.trim() },
  //     {
  //       role: 'assistant',
  //       text: 'Got it. I am reviewing your request and will summarize it clearly for you.',
  //     },

  return (
    <div>
      <Navbar setUserr={setUser} />

      <div className="h-screen bg-gray-100/50 items-stretch flex bg-bg  px-20 py-16 gap-6">
        {conversations.length > 0 && <Sidebar conversations={conversations} currentConversation={conversation} setConversation={setConversation} />}
        
        <div className="w-full mx-auto space-y-8 flex flex-col items-center justify-center">
          {!conversation 
            ? <StartConversation user={user} submit={handleSubmit} setDraft={setDraft} />
            : <ConversationComp data={conversation}  />
          }
        </div>
      </div>
    </div>
  )
}
