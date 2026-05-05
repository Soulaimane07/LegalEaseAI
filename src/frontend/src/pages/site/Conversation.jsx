import { useState } from 'react'

const initialMessages = [
  {
    role: 'assistant',
    text: 'Hi there! Ask me anything about contracts, clauses, or legal risk.',
  },
]

export default function Conversation() {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')

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
    <div className="min-h-screen bg-bg  px-4 py-16">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-google-blue/70">Conversation</p>
          <h1 className="text-4xl font-semibold">Simple legal assistant chat</h1>
          <p className="text-base text-muted">Type a question and get a short legal answer from LegalEase AI.</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-surface2/80 p-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-3xl p-4 ${
                message.role === 'assistant'
                  ? 'bg-surface/90 text-white'
                  : 'bg-google-blue/10 text-white'
              }`}
            >
              <div className="text-xs uppercase tracking-[0.25em] text-white/50 mb-2">
                {message.role === 'assistant' ? 'LegalEase AI' : 'You'}
              </div>
              <p className="text-sm leading-7">{message.text}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-surface2/80 p-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your legal question here..."
            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-google-blue/30"
          />
          <button type="submit" className="btn-primary rounded-full px-6 py-3 self-end">
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
