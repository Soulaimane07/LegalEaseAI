import { useEffect, useRef, useState } from 'react'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    color: 'text-google-blue',
    bg: 'bg-google-blue/10',
    border: 'border-google-blue/20',
    label: 'Agentic AI',
    title: 'Autonomous coding agents',
    desc: 'Delegate entire features to Gemini agents. They read your codebase, write tests, fix bugs, and open pull requests — while you review.',
    code: '$ ag agent "add Stripe checkout to /api/billing"',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    color: 'text-google-green',
    bg: 'bg-google-green/10',
    border: 'border-google-green/20',
    label: 'VS Code Compatible',
    title: 'Your setup, supercharged',
    desc: 'Built on VS Code. Import all your extensions, themes, and keybindings instantly. Zero migration cost — just lift off.',
    code: '$ ag sync --from=vscode',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    color: 'text-google-yellow',
    bg: 'bg-google-yellow/10',
    border: 'border-google-yellow/20',
    label: '1M Token Context',
    title: 'See the whole codebase',
    desc: "With Gemini 2.5 Pro's 1 million token context window, Antigravity understands your entire project simultaneously — no chunking, no missing context.",
    code: '// Entire monorepo in context ✓',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    color: 'text-google-red',
    bg: 'bg-google-red/10',
    border: 'border-google-red/20',
    label: 'Safe by design',
    title: 'Review before it ships',
    desc: 'Every agentic change is shown as a diff. Approve, reject, or iterate. You\'re always the final decision-maker — Gemini lifts the weight, you steer.',
    code: '+ const user = await auth.getUser()',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    label: 'Fast & Local',
    title: 'Runs at the speed of light',
    desc: 'Native app performance. No browser, no lag. Local file access with cloud AI intelligence. The best of both worlds.',
    code: '$ ag --fast-mode on  # ⚡ 340ms p95',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20',
    label: 'Team Collaboration',
    title: 'Ship together, faster',
    desc: 'Share agent sessions, co-review diffs, and sync context across your whole team. Built for the way modern engineering teams actually work.',
    code: '$ ag share --session=abc123',
  },
]

function FeatureCard({ feature, index, visible }) {
  return (
    <div
      className={`card-glass p-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`feature-icon ${feature.bg} border ${feature.border} mb-4`}>
        <span className={feature.color}>{feature.icon}</span>
      </div>
      <div className={`section-label mb-3 text-[10px] ${feature.color} bg-transparent border-transparent px-0`}>
        {feature.label}
      </div>
      <h3 className="text-base font-medium text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-muted leading-relaxed mb-4">{feature.desc}</p>
      <div className="font-mono text-[11px] text-white/40 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
        {feature.code}
      </div>
    </div>
  )
}

export default function Features() {
  const [ref, visible] = useInView()

  return (
    <section ref={ref} className="relative py-32 px-6">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-surface/30 to-bg pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="section-label mx-auto mb-6">Built different</div>
          <h2 className="text-4xl md:text-5xl font-display font-light tracking-tight mb-5">
            Everything your team needs<br />
            <span className="gradient-text">to move without friction</span>
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Antigravity isn't just autocomplete. It's the first IDE where AI agents do the heavy lifting end to end.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  )
}
