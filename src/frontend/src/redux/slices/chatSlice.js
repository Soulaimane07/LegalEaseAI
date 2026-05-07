import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from './firebase';
import { API_BASE_URL } from '../../components/variables';

// --- THUNKS ---

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (autoSelectId = null, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/all`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      return { data, autoSelectId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// New Thunk: Send message to existing conversation
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }, { rejectWithValue }) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const messagePayload = {
        role: "user",
        content: content,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(messagePayload)
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      const data = await response.json();
      // Return the new message and the chat ID it belongs to
      return { chatId, message: data.new_message || messagePayload };
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

      if (!chatResponse.ok) throw new Error("Failed to create conversation");
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

// --- SLICE ---

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    currentConversation: null,
    loading: false,
    error: null,
  },
  reducers: {
    setConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
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
      // Update local message list when a message is successfully sent
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.currentConversation && state.currentConversation.id === action.payload.chatId) {
            // Append the message to the current active view
            state.currentConversation.messages = [
                ...(state.currentConversation.messages || []),
                action.payload.message
            ];
        }
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

export const { setConversation } = chatSlice.actions;
export default chatSlice.reducer;