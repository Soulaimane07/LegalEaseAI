import { useState, useEffect } from 'react'
import { auth } from '../../redux/slices/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import User from './User';
import NavbarLandingDetails from './NavbarLandingDetails';
import { TfiAngleDown } from "react-icons/tfi";

import { useSelector, useDispatch } from 'react-redux';
import { loginWithGoogle, logoutUser, setUser } from '../../redux/slices/authSlice';

export default function NavbarLanding() {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

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

  const links = [
    {
      "title": "Features",
      "link": "#features"
    },
    {
      "title": "Use cases",
      "icon": true,
      "hasDropdown": true,
      "link": "/usecases"
    },
    {
      "title": "Pricing",
      "link": "#pricing"
    },
    {
      "title": "Ressources",
      "icon": true,
      "hasDropdown": true, // Added flag here as well
      "link": "/ressources"
    }
  ]

  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        dispatch(setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        }));
      } else {
        dispatch(setUser(null));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  const handleLogin = async () => {
    const resultAction = await dispatch(loginWithGoogle());
    if (loginWithGoogle.fulfilled.match(resultAction)) {
      navigate('/conversation/' + resultAction.payload.uid);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform hover:bg-white duration-500 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrolled || activeDropdown ? 'bg-white/80 backdrop-blur-xl ' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl relative mx-auto px-6 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <a href="#" className='flex items-center gap-2'>
            <img src='../images/logo.png' className="h-8 w-8" alt="logo" />
            <span className="font-medium tracking-tight text-gray-900">
              LegalEase AI<span className="text-blue-500">.</span>
            </span>
          </a>

          <ul className="hidden ml-10 font-semibold md:flex items-center text-xl">
            {links.map((l, index) => (
              <li 
                key={index}
                // Set the specific title string on hover entry
                onMouseEnter={() => l.hasDropdown && setActiveDropdown(l.title)}
                onMouseLeave={() => l.hasDropdown && setActiveDropdown(null)}
                className="relative py-2" 
              >
                <a href={l.link} className="nav-link flex items-center gap-2 hover:bg-gray-100/80 px-6 py-2 rounded-full text-gray-600">
                  {l.title}
                  <i className={`transition-transform duration-300 inline-block ${activeDropdown === l.title ? 'rotate-180' : ''}`}> 
                    {l.icon && <TfiAngleDown />} 
                  </i>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions Layout */}
        <div className="hidden md:flex items-center gap-3">
          <User
              user={user} 
              open={open} 
              setOpen={setOpen} 
              handleLogin={handleLogin} 
              handleLogout={handleLogout} 
          />
        </div>

        {/* Mobile menu toggle */}
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

      {/* Dynamic Dropdown Container */}
      <div 
        onMouseEnter={() => setActiveDropdown(activeDropdown)}
        onMouseLeave={() => setActiveDropdown(null)}
        className={`absolute rounded-b-2xl top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl transition-all duration-300 origin-top ${
          activeDropdown 
            ? 'opacity-100 scale-y-100 visible' 
            : 'opacity-0 scale-y-95 invisible pointer-events-none'
        }`}
      >
          <NavbarLandingDetails activeType={activeDropdown} />
      </div>

      {/* Mobile menu container details */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
          {links.map((l, index) => <a key={index} href={l.link} className="nav-link text-base text-gray-600">{l.title}</a>)}
          
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