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

const plans = [
  {
    name: 'Generally Available',
    price: '$0',
    period: 'forever',
    desc: 'For individual developers exploring AI-assisted coding.',
    color: 'text-white',
    accent: 'border-white/10',
    btnClass: 'btn-ghost',
    features: [
      'Gemini 2.5 Flash (limited)',
      '50 agent tasks / month',
      '200k token context',
      'VS Code extension sync',
      'Community support',
    ],
  },
  {
    name: 'Recommended',
    price: '$19',
    period: 'per month',
    desc: 'For professional developers who want full AI power.',
    color: 'text-google-blue',
    accent: 'border-google-blue/40',
    btnClass: 'btn-primary',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Gemini 2.5 Pro (full)',
      'Unlimited agent tasks',
      '1M token context window',
      'Planning mode',
      'Team session sharing',
      'Priority support',
      'Early access features',
    ],
  },
  {
    name: 'Coming soon',
    price: 'Custom',
    period: 'contact us',
    desc: 'For engineering teams that need control, compliance, and scale.',
    color: 'text-google-green',
    accent: 'border-white/10',
    btnClass: 'btn-ghost',
    features: [
      'Everything in Pro',
      'Private cloud deployment',
      'SSO & SAML',
      'Audit logs',
      'Custom fine-tuning',
      'SLA & dedicated support',
      'Unlimited seats',
    ],
  },
]

export default function Pricing() {
  const [ref, visible] = useInView()

  return (
    <section id='Pricing' ref={ref} className="my-22 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-6xl font-display font- tracking-tight mb-5">
            Choose the perfect plan <br /> for your journey
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative bg-gray-100/50 rounded-4xl p-8 transition-all duration-700 flex flex-col
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className={`text-sm font-medium mb-2 bg-white w-fit px-3 text-blue-600 rounded-md py-1.5 mb-4 `}>{plan.name}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-display font-light ">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-muted text-sm mb-1">/{plan.period}</span>}
              </div>
              {plan.price === 'Custom' && <span className="text-muted text-sm mb-3">{plan.period}</span>}
              <p className="text-sm text-muted mb-8 leading-relaxed">{plan.desc}</p>

              <button className={plan.btnClass + ' justify-center w-full mb-6'}>
                {plan.name === 'Coming soon' ? 'Contact sales' : plan.price === '$0' ? 'Start Now' : 'Start Pro trial'}
              </button>

              <ul className="flex flex-col gap-3 mb-8 flex-1 border-t-1 border-gray-200 pt-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-black/70">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? '#396545' : '#396545'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
