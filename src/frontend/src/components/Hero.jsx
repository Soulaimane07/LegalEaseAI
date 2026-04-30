import { useEffect, useState, useRef } from 'react'

function useTypewriter(text, speed = 40, delay = 400, onComplete) {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    
    if (started && displayedText.length < text.length) {
      const nextCharTimeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(nextCharTimeout);
    } else if (started && displayedText.length === text.length) {
      if (onComplete) onComplete();
    }

    return () => clearTimeout(startTimeout);
  }, [displayedText, text, speed, started, delay, onComplete]);

  return displayedText;
}

// Remove "default" from here
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    resize()

    // Your Darkened Palette
    const colors = [
      { h: 217, s: 89, l: 40 }, // Deep Blue
      { h: 5, s: 81, l: 35 },   // Crimson Red
      { h: 45, s: 90, l: 30 },  // Golden Amber
    ];

    const particles = Array.from({ length: 100 }, () => {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        color: `hsla(${color.h}, ${color.s}%, ${color.l}%, `,
      }
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        const dx = mouseRef.current.x - p.x
        const dy = mouseRef.current.y - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        const pullRadius = 400
        const avoidRadius = 80

        // 1. MOUSE INTERACTION
        if (distance < pullRadius) {
          const angle = Math.atan2(dy, dx)
          if (distance > avoidRadius) {
            const force = (pullRadius - distance) / pullRadius
            p.vx += Math.cos(angle) * force * 0.2 // Subtle pull
            p.vy += Math.sin(angle) * force * 0.2
          } else {
            const pushForce = (avoidRadius - distance) / avoidRadius
            p.vx -= Math.cos(angle) * pushForce * 0.5 // Subtle push
            p.vy -= Math.sin(angle) * pushForce * 0.5
          }
        }

        // 2. SPACE PHYSICS (Low friction)
        p.vx *= 0.99 // Very little air resistance
        p.vy *= 0.99
        
        p.x += p.vx
        p.y += p.vy

        // 3. INFINITE SCREEN WRAP
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // 4. RENDER
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.alpha + ')'
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      style={{ filter: 'blur(0.8px)' }} // Slightly increased blur for "glassy" depth
    />
  )
}

/* Orbiting element */
function OrbitingDot({ color, delay, radius, duration }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full"
      style={{
        background: color,
        boxShadow: `0 0 12px ${color}`,
        animation: `orbit ${duration}s linear infinite`,
        animationDelay: delay,
        '--orbit-radius': `${radius}px`,
        transformOrigin: `-${radius}px 50%`,
        marginLeft: `-${radius + 5}px`,
        marginTop: '-5px',
      }}
    />
  )
}

/* Floating code badge */
function FloatingBadge({ children, className, delay }) {
  return (
    <div
      className={`floating-badge animate-float animation-fill-both ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  )
}

export default function Hero() {
  const [isTypingDone, setIsTypingDone] = useState(false);
  const fullTitle = "Experience liftoff with the next-gen agent platform";
  
  const typedTitle = useTypewriter(fullTitle, 35, 500, () => {
    setIsTypingDone(true);
  });

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden ">
      <ParticleCanvas />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundSize: '64px 64px' }} />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-12 pb-20">
        {/* Label */}
        <div className={`flex items-center justify-center space-x-2 mb-8 transition-all duration-1000 transform ${
          isTypingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <img src="../images/logo.png" alt="logo" className='w-7' />
          <p className='font-semibold text-xl'> LegalEase AI. </p>
        </div>

        {/* Headline with Typewriter effect */}
        <h1 className="text-5xl mb-20 font-semibold md:text-6xl font-display font-light leading-[1.05] tracking-tight mb-6 min-h-[120px]">
          {typedTitle}
          {!isTypingDone && (
            <span className="inline-block w-1 h-10 md:h-12 ml-1 bg-blue-500 animate-pulse align-middle" />
          )}
        </h1>

        {/* CTA buttons */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-300 transform ${
          isTypingDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        }`}>
          <button className="btn-primary cursor-pointer bg-black text-white rounded-full text-md text-base px-16 py-3">
            Start for Free
          </button>
          
          {/* Glass Button using the darkened colors we set earlier */}
          <button className="btn-ghost cursor-pointer rounded-full text-md text-base px-8 py-3 
                   bg-gray-100/50 backdrop-blur-md border border-/20 
                   hover:bg-gray-200/20 transition-all duration-300 flex items-center gap-2 border-1 border-black/10 ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            Watch demo
          </button>
        </div>
      </div>
    </section>
  )
}

