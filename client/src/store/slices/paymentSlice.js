import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Create payment intent (for Stripe)
export const createPaymentIntent = createAsyncThunk(
  'payment/createPaymentIntent',
  async ({ bookingId, amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-intent', { 
        bookingId,
        amount
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create payment intent' });
    }
  }
);

// Create Razorpay order
export const createRazorpayOrder = createAsyncThunk(
  'payment/createRazorpayOrder',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create-order', paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create payment order');
    }
  }
);

// Verify payment
export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/verify', verificationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Payment verification failed');
    }
  }
);

// Remove this duplicate thunk
export const getPaymentHistory = createAsyncThunk(
  'payment/getHistory',
  async (_, { rejectWithValue }) => {
    try {
      // Update to use the correct endpoint
      const response = await api.get('/payments/history');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch payment history');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/history');
      console.log('Payment history response:', response.data); // Add debug logging
      return response.data.payments || [];
    } catch (error) {
      console.error('Payment history fetch error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment history');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    loading: false,
    error: null,
    history: [],
    currentOrder: null,
    lastPayment: null,
    currentPayment: null,
    paymentHistory: [],
    status: 'idle'
  },
  reducers: {
    clearPaymentError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearPayment: (state) => {
      state.currentPayment = null;
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle createPaymentIntent
      .addCase(createPaymentIntent.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPayment = {
          provider: 'stripe',
          ...action.payload
        };
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to create payment intent';
      })
      
      // Handle createRazorpayOrder
      .addCase(createRazorpayOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = {
          ...action.payload.order,
          provider: 'razorpay',
          key: action.payload.key
        };
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create order';
      })
      
      // Handle verifyPayment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.lastPayment = action.payload.payment;
        state.currentOrder = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Payment verification failed';
      })
      
      // Handle getPaymentHistory
      .addCase(getPaymentHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.payments;
      })
      .addCase(getPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch payment history';
      })
      
      // Handle fetchPaymentHistory
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.paymentHistory = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch payment history';
      });
  }
});


export const { clearPaymentError, clearCurrentOrder, clearPayment } = paymentSlice.actions;

export default paymentSlice.reducer;