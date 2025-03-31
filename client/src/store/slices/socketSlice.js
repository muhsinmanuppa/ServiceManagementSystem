import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import io from 'socket.io-client';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Initialize socket connection
export const initializeSocket = createAsyncThunk(
  'socket/initialize',
  async (token, { rejectWithValue }) => {
    try {
      if (!token) {
        console.log('No token provided, skipping socket connection');
        return null;
      }
      
      console.log('Connecting to socket server...');
      const socket = io(API_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      // Wrap in a promise to handle connection
      return new Promise((resolve, reject) => {
        socket.on('connect', () => {
          console.log('Socket connected with ID:', socket.id);
          resolve(socket);
        });
        
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(error.message);
        });
        
        // Set a timeout to reject if connection takes too long
        setTimeout(() => {
          if (!socket.connected) {
            reject('Socket connection timeout');
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Socket initialization error:', error);
      return rejectWithValue(error.message || 'Failed to connect to socket');
    }
  }
);

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    socket: null,
    connected: false,
    error: null,
    loading: false
  },
  reducers: {
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.connected = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeSocket.fulfilled, (state, action) => {
        state.socket = action.payload;
        state.connected = !!action.payload;
        state.loading = false;
      })
      .addCase(initializeSocket.rejected, (state, action) => {
        state.error = action.payload || 'Failed to connect';
        state.loading = false;
        state.connected = false;
      });
  }
});

export const { disconnectSocket } = socketSlice.actions;
export default socketSlice.reducer;
