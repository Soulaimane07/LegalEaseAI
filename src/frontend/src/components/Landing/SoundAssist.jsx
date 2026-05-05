import React, { useRef, useEffect } from 'react'

function ParticleCanvas() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const parent = canvas.parentElement // Get the container
    let raf

    const resize = () => {
      // FIX: Use parent dimensions instead of window
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }

    const handleMouseMove = (e) => {
      // FIX: Calculate mouse position relative to the container, not the screen
      const rect = parent.getBoundingClientRect()
      mouseRef.current = { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      }
    }

    // Use ResizeObserver to handle container changes
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    
    window.addEventListener('mousemove', handleMouseMove)
    resize()

    const colors = [
        { h: 0, s: 0, l: 100 },   // Pure White
        { h: 217, s: 90, l: 70 }, // Your brand blue (but bright)
    ];

    // Reduced count slightly so the screen isn't overwhelmed by larger dots
    const particles = Array.from({ length: 150 }, () => {
    const color = colors[Math.floor(Math.random() * colors.length)]
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // CHANGED: Increased base size (4) and variance (+ 3)
        r: Math.random() * 3 + 3, 
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.3, // Slightly higher visibility
        color: `hsla(${color.h}, ${color.s}%, ${color.l}%, `,
    }
    })

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        const dx = mouseRef.current.x - p.x
        const dy = mouseRef.current.y - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const pullRadius = 300
        const avoidRadius = 60

        if (distance < pullRadius) {
          const angle = Math.atan2(dy, dx)
          if (distance > avoidRadius) {
            p.vx += Math.cos(angle) * 0.2
            p.vy += Math.sin(angle) * 0.2
          } else {
            p.vx -= Math.cos(angle) * 0.5
            p.vy -= Math.sin(angle) * 0.5
          }
        }

        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

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
      ro.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="block w-full h-full pointer-events-none" 
      style={{ filter: 'blur(0.7px)' }}
    />
  )
}

function SoundAssist() {
  return (
    <div className='relative bg- min-h-screen w-full text-white flex items-center px-20 font-semibold rounded-[40px] overflow-hidden'>
      
      {/* 1. Background Layer */}
      <div className="absolute bg-black inset-0 z-0">
         <ParticleCanvas />
      </div>

      {/* 2. Content Layer */}
      <div className='relative z-10 py-72 w-full'>
        <h1 
            className='text-4xl' 
            style={{ fontSize: '50px' }}
        >
            Let's start asking <br /> 
            LegalSoune <br /> 
            Now.
        </h1>
        
        <button className='bg-white cursor-pointer text-black hover:bg-gray-100 transition-colors rounded-full text-base px-20 mt-10 py-3 relative z-20'>
          Let's Talk
        </button>
        <button className=' cursor-pointer text-white px-10 mt-10 py-3 relative z-20'>
          Watch Demo
        </button>
      </div>

    </div>
  )
}

export default SoundAssist;