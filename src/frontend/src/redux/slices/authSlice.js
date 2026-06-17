import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { API_BASE_URL } from '../../components/variables';

const BACKEND_URL = "https://silver-fiesta-p5x6gpxv5w9c7p9r-8000.app.github.dev"; 

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
        plan: profileData.subscription_plan, // Ensure your FastAPI returns 'subscription_plan'
        token: token 
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (firebaseUser, { rejectWithValue }) => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed fetching profile.");
      const data = await response.json();

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        plan: data.subscription_plan, // matches your FastAPI return key
        token: token
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch the subscription profile (plan + remaining free analyses).
// export const fetchUserProfile = createAsyncThunk(
//   'auth/fetchUserProfile',
//   async (firebaseUser, { rejectWithValue }) => {
//     try {
//       const token = await firebaseUser.getIdToken();
//       const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
//         method: "GET",
//         headers: { "Authorization": `Bearer ${token}` }
//       });

//       if (!response.ok) throw new Error("Failed fetching profile.");
//       const data = await response.json();

//       return {
//         uid: firebaseUser.uid,
//         email: firebaseUser.email,
//         displayName: firebaseUser.displayName,
//         photoURL: firebaseUser.photoURL,
//         plan: data.subscription_plan, // matches your FastAPI return key
//         token: token
//       };
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

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
    },
    openUpgrade: (state) => { state.upgradeOpen = true; },
    closeUpgrade: (state) => { state.upgradeOpen = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => { state.status = 'loading'; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload; // This updates the state with the plan!
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
