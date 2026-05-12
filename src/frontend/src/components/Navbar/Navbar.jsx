import React, { useState, useEffect, useCallback } from 'react';
import User from './User';
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

import { useSelector, useDispatch } from 'react-redux';
import { loginWithGoogle, logoutUser, setUser } from '../../redux/slices/authSlice';
import { auth } from '../../redux/slices/firebase';
import { IoIosGlobe } from 'react-icons/io';
import Contries from './Contries';

function Navbar() {
    // UI Local States
    const [open, setOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [scrolled, setScrolled] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state) => state.auth);

    // Navbar scroll logic
    useEffect(() => {
        const controlNavbar = () => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 20);
    
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
        };
    
        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    // Sync Firebase Auth with Redux
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

    // Authentication Handlers using Redux Thunks
    const handleLogin = useCallback(async () => {
        const resultAction = await dispatch(loginWithGoogle());
        if (loginWithGoogle.fulfilled.match(resultAction)) {
            console.log("Logged in user:", resultAction.payload);
            navigate('/conversation/' + resultAction.payload.uid);
        }
    }, [dispatch, navigate]);

    const handleLogout = useCallback(async () => {
        const resultAction = await dispatch(logoutUser());
        if (logoutUser.fulfilled.match(resultAction)) {
            setOpen(false);
            navigate('/');
            console.log("User signed out");
        }
    }, [dispatch, navigate]);

    return (
        <nav 
            className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ${
                isVisible ? 'translate-y-0' : '-translate-y-full'
            } ${
                scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100' : 'bg-transparent'
            }`}
        >
            <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
                <a href="/" className='flex items-center gap-2'>
                    <img src='../images/logo.png' className="h-8 w-8" alt="logo" />
                    <span className="font-medium tracking-tight text-gray-900">
                        LegalEase AI<span className="text-blue-500">.</span>
                    </span>
                </a>

                <div className="flex items-center gap-6">
                    <Contries />

                    <User 
                        user={user} 
                        open={open} 
                        setOpen={setOpen} 
                        handleLogin={handleLogin} 
                        handleLogout={handleLogout} 
                    />
                </div>
            </div>
        </nav>
    );
}

export default Navbar;