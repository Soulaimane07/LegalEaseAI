import { useState, useEffect } from 'react'

export default function NavbarLanding() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY

      // 1. Determine if background should be blurred/colored (after 20px)
      setScrolled(currentScrollY > 20)

      // 2. Logic for Hide/Show on scroll
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down & passed the header: hide
        setIsVisible(false)
      } else {
        // Scrolling up: show
        setIsVisible(true)
      }

      // Update last position
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY]) // Dependency on lastScrollY is necessary for accurate comparison

  const links = ['Features', 'Use cases', 'Pricing', 'Ressources']

  return (
    <nav 
      className={`fixed top-0 left-0  right-0 z-50 transition-transform duration-500 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrolled ? 'bg-white/80 backdrop-blur-xl ' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <a href="#" className='flex items-center gap-2'>
            <img src='../images/logo.png' className="h-8 w-8" alt="logo" />
            <span className="font-medium tracking-tight text-gray-900">
              LegalEase AI<span className="text-google-blue">.</span>
            </span>
          </a>

          <ul className="hidden ml-10 font-semibold md:flex items-center text-xl">
            {links.map(l => (
              <li key={l}>
                <a href={`#${l}`} className="nav-link  hover:bg-gray-100/80 px-6 py-2 rounded-full text-gray-600 hover:color-muted">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button className="btn-ghost cursor-pointer bg-black text-white rounded-full text-sm py-2 px-6">Sign in</button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted hover:text-google-blue transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen
              ? <><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>
              : <><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {links.map(l => <a key={l} href="#" className="nav-link text-base text-gray-600">{l}</a>)}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <button className="btn-ghost justify-center">Sign in</button>
            <button className="btn-primary justify-center">Download</button>
          </div>
        </div>
      )}
    </nav>
  )
}