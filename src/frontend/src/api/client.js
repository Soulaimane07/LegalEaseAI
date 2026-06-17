// src/api/client.js
import { auth } from '../redux/slices/firebase';

export const authenticatedFetch = async (url, options = {}) => {
  // Ensure we wait for Firebase auth to initialize if it hasn't already
  const user = auth.currentUser;
  if (!user) throw new Error("No user authenticated");

  // Get fresh token
  const token = await user.getIdToken(true);
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    throw new Error("Unauthorized: Please log in again.");
  }
  
  return response;
};