import React, { useEffect, useState, useCallback } from 'react'; // Added useState
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchConversations } from '../redux/slices/chatSlice';

import { onAuthStateChanged } from "firebase/auth";
import { fetchUserProfile, loginWithGoogle, logoutUser, setUser } from '../redux/slices/authSlice';
import { auth } from '../redux/slices/firebase';

const BACKEND_URL = "https://silver-fiesta-p5x6gpxv5w9c7p9r-8000.app.github.dev";

export const Subscription = () => {
    const [searchParams] = useSearchParams(); 
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Pull the user object from Redux. 
    const { user } = useSelector((state) => state.auth); 
    
    // NEW: Local state to securely hold the Firebase JWT token string once it's extracted
    const [fbToken, setFbToken] = useState(null);

    // 1. Monitor real-time authentication state change
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                dispatch(fetchUserProfile(currentUser));
                
                // NEW: Force Firebase to provide the authentic JWT token string
                const tokenString = await currentUser.getIdToken();
                setFbToken(tokenString);
            } else {
                dispatch(setUser(null));
                setFbToken(null);
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

    // 2. Handle Subscription patch once both parameters are confirmed
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        
        console.log("=== SUBSCRIPTION OBSERVATION ===");
        console.log("URL Status:", paymentStatus);
        console.log("Redux User Context loaded?:", !!user);
        console.log("Firebase Token extracted?:", !!fbToken); // Check our new token source

        if (paymentStatus === 'success') {
            // UPDATED: Check fbToken instead of the missing Redux slice token
            if (!user || !fbToken) {
                console.log("⏳ Waiting for Redux User context and Firebase token string to hydrate...");
                return; 
            }

            console.log("🚀 Everything loaded! Executing database tier upgrade patch request...");
            
            fetch(`${BACKEND_URL}/api/user/subscription`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${fbToken}` // Pass the newly verified string token
                },
                body: JSON.stringify({ plan: 'subscribed' }) 
            })
            .then((res) => {
                if (!res.ok) throw new Error("Database validation error returned by backend engine.");
                return res.json();
            })
            .then((data) => {
                console.log("✅ Backend updated successfully:", data);
                
                const destinationId = user.user_id || user.id || 'dashboard';
                navigate(`/conversation/${destinationId}`, { replace: true });
                
                window.location.reload(); 
            })
            .catch((err) => console.error("❌ Plan upgrade hook failure:", err));
        }
    // Added fbToken to dependency array so this re-evaluates automatically when token resolves
    }, [searchParams, user, fbToken, navigate]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-gray-800 font-medium">
            <div className="text-center p-6 bg-white shadow-sm rounded-xl border border-gray-100">
                <p className="text-base font-semibold text-gray-900 animate-pulse">
                    {!user || !fbToken ? "Authenticating session..." : "Syncing premium configuration..."}
                </p>
                <p className="text-xs text-gray-400 mt-1">Please keep this window open while we secure your workspace.</p>
            </div>
        </div>
    );
};