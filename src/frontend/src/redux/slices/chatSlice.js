import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from './firebase';
import { API_BASE_URL } from '../../components/variables';
import { openUpgrade, fetchUserProfile } from './authSlice';

// Parse a failed response; if the backend asks for an upgrade, open the modal.
async function readError(response, dispatch) {
  const body = await response.json().catch(() => ({}));
  const detail = body.detail;
  if (detail && typeof detail === 'object' && detail.code === 'UPGRADE_REQUIRED') {
    if (dispatch) dispatch(openUpgrade());
    return detail.message || 'Passez au plan Pro pour continuer.';
  }
  return (typeof detail === 'string' ? detail : detail?.message) || 'Une erreur est survenue.';
}

// --- THUNKS ---

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (autoSelectId = null, { rejectWithValue }) => {
    try {
      // Only the signed-in user's own conversations are fetched (per-user session).
      if (!auth.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      return { data, autoSelectId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Send a message AND get the RAG-grounded AI reply in one round-trip.
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content, language = 'fr' }, { dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ content, language })
      });

      if (!response.ok) {
        throw new Error(await readError(response, dispatch));
      }

      const data = await response.json();
      // Backend returns both the saved user message and the AI reply.
      return {
        chatId,
        userMessage: data.user_message,
        assistantMessage: data.assistant_message,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewChat = createAsyncThunk(
  'chat/createNewChat',
  async (initialMessage, { dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);

      const chatResponse = await fetch(`${API_BASE_URL}/chat/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: initialMessage }),
      });

      if (!chatResponse.ok) throw new Error(await readError(chatResponse, dispatch));
      const chatData = await chatResponse.json();
      const newConversationId = chatData.conversation_id;

      await dispatch(sendMessage({ chatId: newConversationId, content: initialMessage }));
      await dispatch(fetchConversations(newConversationId));
      
      return newConversationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Attach a PDF to the (current or new) conversation so the AI answers from it.
export const attachDocument = createAsyncThunk(
  'chat/attachDocument',
  async (file, { getState, dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      let chatId = getState().chat.currentConversation?.id;

      // On the "new chat" screen there is no conversation yet -> create one
      // named after the file, then attach to it.
      if (!chatId) {
        const r = await fetch(`${API_BASE_URL}/chat/new`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: file.name }),
        });
        if (!r.ok) throw new Error(await readError(r, dispatch));
        chatId = (await r.json()).conversation_id;
      }

      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${API_BASE_URL}/chat/${chatId}/attach`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        throw new Error(await readError(res, dispatch));
      }

      await dispatch(fetchConversations(chatId));
      return chatId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatId, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Delete request failed");

      const { currentConversation } = getState().chat;
      if (currentConversation?.id === chatId) {
        dispatch(setConversation(null));
      }

      dispatch(fetchConversations());
      return chatId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const renameChat = createAsyncThunk(
  'chat/renameChat',
  async ({ chatId, title }, { dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) throw new Error("Rename failed");

      dispatch(fetchConversations());
      return { chatId, title };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Run the structured contract analysis on the conversation's attached document.
export const analyzeContract = createAsyncThunk(
  'chat/analyzeContract',
  async ({ chatId, language = 'fr' }, { dispatch, rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatId}/analyze?language=${encodeURIComponent(language)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error(await readError(response, dispatch));
      }
      const data = await response.json(); // { status, document, analysis, analyses_remaining }
      dispatch(fetchUserProfile()); // refresh remaining free analyses
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- SLICE ---

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    currentConversation: null,
    loading: false,
    error: null,
    // Contract-analysis panel state (separate from chat loading).
    analysis: null,
    analysisDocument: null,
    analysisLoading: false,
    analysisError: null,
    analysisOpen: false,
  },
  reducers: {
    setConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    openAnalysisPanel: (state) => { state.analysisOpen = true; },
    closeAnalysisPanel: (state) => { state.analysisOpen = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => { state.loading = true; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.data;
        if (action.payload.autoSelectId) {
          state.currentConversation = action.payload.data.find(c => c.id === action.payload.autoSelectId);
        }
      })
      // Append BOTH the user message and the AI reply to the active view.
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentConversation && state.currentConversation.id === action.payload.chatId) {
            const additions = [action.payload.userMessage, action.payload.assistantMessage].filter(Boolean);
            state.currentConversation.messages = [
                ...(state.currentConversation.messages || []),
                ...additions
            ];
        }
      })
      // --- Contract analysis ---
      .addCase(analyzeContract.pending, (state) => {
        state.analysisLoading = true;
        state.analysisError = null;
        state.analysis = null;
        state.analysisOpen = true; // open the panel right away (shows loader)
      })
      .addCase(analyzeContract.fulfilled, (state, action) => {
        state.analysisLoading = false;
        state.analysis = action.payload.analysis;
        state.analysisDocument = action.payload.document;
      })
      .addCase(analyzeContract.rejected, (state, action) => {
        state.analysisLoading = false;
        state.analysisError = action.payload;
      })
      // Global Loading Matcher for all mutations
      .addMatcher(
        (action) => action.type.endsWith('/pending') && 
        (action.type.includes('deleteChat') || action.type.includes('renameChat') || action.type.includes('sendMessage') || action.type.includes('createNewChat')),
        (state) => { state.loading = true; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => { state.loading = false; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { setConversation, openAnalysisPanel, closeAnalysisPanel } = chatSlice.actions;
export default chatSlice.reducer;