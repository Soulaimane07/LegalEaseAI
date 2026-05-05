import { useState } from 'react'
import Sidebar from '../../components/Conversation/Sidebar'
import { Footer } from '../../components/FooterCTA'
import Navbar from '../../components/Navbar/Navbar'
import StartConversation from '../../components/Conversation/StartConversation'

const initialMessages = [
  {
    role: 'assistant',
    text: 'Hi there! Ask me anything about contracts, clauses, or legal risk.',
  },
]

export default function Conversation() {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')

  const [user, setUser] = useState(null)


  const handleSubmit = (event) => {
    event.preventDefault()
    if (!draft.trim()) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: draft.trim() },
      {
        role: 'assistant',
        text: 'Got it. I am reviewing your request and will summarize it clearly for you.',
      },
    ])

    setDraft('')
  }

  return (
    <div>
      <Navbar setUserr={setUser} />

      <div className="h-screen bg-gray-100/50 items-stretch flex bg-bg  px-20 py-16 gap-12">
        <Sidebar />
        
        <div className="w-full mx-auto space-y-8 flex flex-col items-center justify-center">
          <StartConversation user={user} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
