import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  lastAuthTime: localStorage.getItem('authTime')
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid server response');
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('authTime', Date.now().toString());

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue({
        message: error.response?.data?.message || 'Login failed',
        status: error.response?.status
      });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Registration failed',
          details: error.message
        }
      );
    }
  }
);

export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (email, { rejectWithValue }) => {
    try {
      console.log('Sending OTP to:', email);
      
      // Make sure email is properly passed as an object
      const data = typeof email === 'string' ? { email } : email;
      
      const response = await api.post('/auth/send-otp', data);
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to send OTP',
        status: error.response?.status,
        details: error
      });
    }
  }
);

// resendOtp
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to resend OTP');
    }
  }
);

// verifyOtp
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'OTP verification failed');
    }
  }
);

// update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

// verification status update
export const applyForVerification = createAsyncThunk(
  'auth/applyForVerification',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/provider/apply-verification', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to apply for verification');
    }
  }
);

export const validateSessionAsync = createAsyncThunk(
  'auth/validateSession',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await api.post('/auth/validate-token', { token });
      return {
        user: response.data.user,
        token
      };
    } catch (error) {
      dispatch(logout());
      return rejectWithValue(error.response?.data || { message: 'Session validation failed' });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authTime');
      
      // Reset state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      
      // Clear Authorization header
      delete api.defaults.headers.common['Authorization'];
    },
    // Add token refresh reducer
    refreshToken: (state, action) => {
      const { token } = action.payload;
      state.token = token;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    setAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearRedirect: (state) => {
      state.redirectTo = null;
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload
      };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    validateLocalSession: (state) => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const authTime = localStorage.getItem('authTime');

      if (!token || !user) {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        delete api.defaults.headers.common['Authorization'];
      } else {
        state.isAuthenticated = true;
        state.user = user;
        state.token = token;
        state.lastAuthTime = authTime;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },
    updateVerificationStatus: (state, action) => {
      if (state.user) {
        state.user.verificationStatus = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.lastAuthTime = Date.now().toString();
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationData = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.emailVerified = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(applyForVerification.fulfilled, (state, action) => {
        if (state.user) {
          state.user.verificationStatus = action.payload.verificationStatus;
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      .addCase(validateSessionAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateSessionAsync.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(validateSessionAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  }
});

export const { 
  logout, 
  refreshToken, 
  clearAuthError, 
  setAuth, 
  clearAuth, 
  clearRedirect, 
  updateUser, 
  validateLocalSession, 
  updateVerificationStatus
} = authSlice.actions;

export default authSlice.reducer;
