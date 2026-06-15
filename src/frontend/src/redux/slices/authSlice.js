import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { API_BASE_URL } from '../../components/variables';

// Async Thunk for Google Login
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch the subscription profile (plan + remaining free analyses).
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Profile fetch failed');
      return await res.json(); // { subscription_plan, analyses_remaining, exhausted, ... }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Upgrade the user to the paid plan (called after payment, or to test).
export const upgradeToPro = createAsyncThunk(
  'auth/upgradeToPro',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/user/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: 'subscribed' }),
      });
      if (!res.ok) throw new Error('Upgrade failed');
      const data = await res.json();
      dispatch(fetchUserProfile()); // refresh plan/remaining
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async Thunk for Logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth);
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    profile: null,       // { subscription_plan, analyses_remaining, exhausted, ... }
    upgradeOpen: false,  // is the "Upgrade to Pro" modal open?
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.status = 'succeeded';
    },
    openUpgrade: (state) => { state.upgradeOpen = true; },
    closeUpgrade: (state) => { state.upgradeOpen = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => { state.status = 'loading'; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(upgradeToPro.fulfilled, (state) => {
        state.upgradeOpen = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.profile = null;
      });
  },
});

export const { setUser, openUpgrade, closeUpgrade } = authSlice.actions;
export default authSlice.reducer;
