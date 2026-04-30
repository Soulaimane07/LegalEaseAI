import { useEffect, useRef, useState } from 'react'

function useInView() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

export default function Modes() {
  const [ref, visible] = useInView()
  const [active, setActive] = useState('fast')

  const modes = {
    fast: {
      label: 'Fast Mode',
      tag: '⚡ Instant',
      tagColor: 'text-google-yellow bg-google-yellow/10',
      desc: 'Point at a task. Get a diff in seconds. Perfect for focused, low-risk changes where you want speed.',
      examples: [
        { cmd: '"Fix the typo in Navbar.tsx"', time: '1.2s' },
        { cmd: '"Add loading state to submit button"', time: '0.8s' },
        { cmd: '"Change primary color to #4285f4"', time: '0.6s' },
      ],
      accent: 'google-yellow',
    },
    planning: {
      label: 'Planning Mode',
      tag: '🧠 Deep work',
      tagColor: 'text-google-blue bg-google-blue/10',
      desc: 'Give Antigravity a complex goal. It creates a step-by-step plan, checks in at each milestone, and ships the entire feature.',
      examples: [
        { cmd: '"Build user auth with Google OAuth + sessions"', steps: 6 },
        { cmd: '"Migrate PostgreSQL to Supabase with RLS"', steps: 12 },
        { cmd: '"Add Stripe billing with webhooks + dashboard"', steps: 9 },
      ],
      accent: 'google-blue',
    },
  }

  const mode = modes[active]

  return (
    <section ref={ref} className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-google-blue/[0.04] blur-[80px] pointer-events-none" />

      <div className={`relative max-w-5xl mx-auto transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="text-center mb-16">
          <div className="section-label mx-auto mb-6">Two modes</div>
          <h2 className="text-4xl md:text-5xl font-display font-light tracking-tight mb-5">
            Choose how you want to{' '}
            <span className="gradient-text">collaborate</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Switch between instant task execution and deep-planning mode — depending on what you're building.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex p-1 rounded-xl bg-surface border border-white/[0.07]">
            {Object.entries(modes).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active === key
                    ? 'bg-google-blue text-white shadow-lg shadow-google-blue/30'
                    : 'text-muted hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode panel */}
        <div className="card-glass p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${mode.tagColor}`}>
                {mode.tag}
              </span>
              <h3 className="text-2xl font-medium text-white mb-3">{mode.label}</h3>
              <p className="text-muted leading-relaxed mb-6">{mode.desc}</p>

              <div className="flex flex-col gap-3">
                {mode.examples.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3">
                    <span className="font-mono text-[12px] text-white/70">{ex.cmd}</span>
                    {ex.time && (
                      <span className={`text-[11px] text-google-yellow font-medium ml-3 shrink-0`}>{ex.time}</span>
                    )}
                    {ex.steps && (
                      <span className="text-[11px] text-google-blue font-medium ml-3 shrink-0">{ex.steps} steps</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="md:w-64 flex-shrink-0">
              <ModeVisual mode={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ModeVisual({ mode }) {
  if (mode === 'fast') {
    return (
      <div className="bg-black/40 border border-white/[0.07] rounded-2xl p-5 h-full min-h-[220px] flex flex-col gap-3">
        <div className="text-xs text-muted mb-1">Command</div>
        <div className="font-mono text-[12px] text-google-yellow bg-google-yellow/10 rounded-lg px-3 py-2 border border-google-yellow/20">
          "Change button to outline style"
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <div className="w-4 h-px bg-white/20" />
          <span>0.8s</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>
        <div className="font-mono text-[11px] leading-5">
          <div className="text-google-red">- variant="solid"</div>
          <div className="text-google-green">+ variant="outline"</div>
          <div className="text-google-green">+ borderColor="blue.500"</div>
        </div>
        <div className="mt-auto flex gap-2">
          <button className="flex-1 py-1.5 rounded-lg bg-google-green/20 text-google-green text-xs font-medium border border-google-green/30">Accept</button>
          <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-muted text-xs font-medium border border-white/10">Reject</button>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-black/40 border border-white/[0.07] rounded-2xl p-5 h-full min-h-[220px] flex flex-col gap-2.5">
      <div className="text-xs text-muted mb-1">Agent plan</div>
      {[
        { step: 'Analyze auth requirements', done: true },
        { step: 'Install Firebase SDK', done: true },
        { step: 'Create auth provider', done: true },
        { step: 'Build login UI', done: false, active: true },
        { step: 'Add session management', done: false },
        { step: 'Write tests', done: false },
      ].map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
            s.done ? 'bg-google-green/20 text-google-green' :
            s.active ? 'bg-google-blue/30 text-google-blue animate-pulse' :
            'bg-white/[0.05] text-white/20'
          }`}>
            {s.done ? '✓' : s.active ? '▶' : '○'}
          </span>
          <span className={`text-[11px] ${s.done ? 'text-white/40 line-through' : s.active ? 'text-white' : 'text-white/30'}`}>
            {s.step}
          </span>
        </div>
      ))}
    </div>
  )
}
