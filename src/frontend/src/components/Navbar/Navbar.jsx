import React, {useState, useEffect} from 'react'
import User from './User'
import { auth, googleProvider } from "./firebase"; 
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

function Navbar({setUserr}) {
    const [user, setUser] = useState(null) // Tracks the authenticated user
    const [open, setOpen] = useState(false) // Tracks the authenticated user
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const [scrolled, setScrolled] = useState(false)

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








    const navigate = useNavigate();

  // Listen for authentication changes globally
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserr(currentUser); // Update local state with the authenticated user
    });
    return () => unsubscribe(); // Clean up subscription on unmount
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Logged in user:", result.user);
      navigate('/conversation/'+result.user.uid); // Navigate to dashboard after login
    } catch (error) {
      console.error("Login Error:", error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setOpen(false); // Close the profile dropdown on logout
      navigate('/');
      console.log("User signed out");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        scrolled ? 'bg-white/80 backdrop-blur-xl ' : 'bg-transparent'
      }`}
    >
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
            <a href="#" className='flex items-center gap-2'>
                <img src='../images/logo.png' className="h-8 w-8" alt="logo" />
                <span className="font-medium tracking-tight text-gray-900">
                LegalEase AI<span className="text-blue-500">.</span>
                </span>
            </a>

            <User 
              user={user} 
              open={open} 
              setOpen={setOpen} 
              handleLogin={handleLogin} 
              handleLogout={handleLogout} 
            />
        </div>
    </nav>
  )
}

export default Navbar