import { useState, useEffect } from 'react'
import { auth, googleProvider } from "./firebase"; 
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

export default function NavbarLanding() {
  const [user, setUser] = useState(null) // Tracks the authenticated user
  const [open, setOpen] = useState(false) // Tracks the authenticated user
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen for authentication changes globally
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); // Clean up subscription on unmount
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in user:", result.user);
    } catch (error) {
      console.error("Login Error:", error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpen(false); // Close the profile dropdown on logout
      console.log("User signed out");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 20)

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  const links = ['Features', 'Use cases', 'Pricing', 'Ressources']

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ${
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
              LegalEase AI<span className="text-blue-500">.</span>
            </span>
          </a>

          <ul className="hidden ml-10 font-semibold md:flex items-center text-xl">
            {links.map(l => (
              <li key={l}>
                <a href={`#${l}`} className="nav-link hover:bg-gray-100/80 px-6 py-2 rounded-full text-gray-600">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Actions Layout (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            /* User Profile & Sign Out Display */
            <button onClick={()=> setOpen(!open)} className="flex cursor-pointer bg-gray-100 hover:bg-gray-200 transition-all  items-center p-0.5 rounded-full">
              <img 
                src={user.photoURL || "../images/default-avatar.png"} 
                alt="Profile" 
                className="h-9 w-9 rounded-full border border-gray-200"
                referrerPolicy="no-referrer" // Prevents Google image loading restrictions
              />

              {/*  */}
            </button>
          ) : (
            /* Authentication Call to Actions */
            <>
              <button 
                onClick={handleLogin} 
                className="btn-ghost cursor-pointer bg-gray-100 text-gray-900 font-medium rounded-full text-sm py-2 px-6 hover:bg-gray-200 transition-colors"
              >
                Sign in
              </button>
              
              <button 
                onClick={handleLogin}
                className="btn-primary cursor-pointer bg-black text-white rounded-full text-sm font-medium px-6 py-2 transition-transform active:scale-95"
              >
                Start for Free
              </button>
            </>
          )}
        </div>

        {(user && open) && (
          <div className="flex flex-col items-center gap-3 absolute top-12 right-20 bg-white border border-gray-200 rounded-2xl p-4  shadow-lg">
            {/* User Profile Display */}
            <div className="flex flex-col gap-3 px-4 py-2">
              <p className="text-xs text-gray-500 text-center font-medium">  {user.email}</p>
              <img 
                src={user.photoURL || "../images/default-avatar.png"} 
                alt="Profile" 
                className="h-20 mx-auto w-20 rounded-full border border-gray-200"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 text-center"> Hi, {user.displayName || "User"}! </p>
                
              </div>
              <button 
                onClick={handleLogout}
                className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors ml-2 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Mobile hamburger button layout */}
        <button
          className="md:hidden text-gray-600 hover:text-blue-600 transition-colors"
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

      {/* Mobile menu container details */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {links.map(l => <a key={l} href="#" className="nav-link text-base text-gray-600">{l}</a>)}
          
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {user ? (
              <div className="flex flex-col gap-3 p-2 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="h-10 w-10 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button onClick={handleLogout} className="w-full text-center py-2 bg-red-50 text-red-600 rounded-full font-medium text-sm">
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleLogin} className="btn-ghost justify-center py-2 bg-gray-100 rounded-full">Sign in</button>
                <button onClick={handleLogin} className="btn-primary justify-center py-2 bg-black text-white rounded-full">Start for Free</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}