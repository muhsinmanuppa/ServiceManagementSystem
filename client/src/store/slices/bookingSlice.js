import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import api from '../../utils/api';

export const BOOKING_STATUS = {
  PENDING: 'pending',
  QUOTED: 'quoted',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};


export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data.booking ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create booking');
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (userType, { rejectWithValue }) => {
    try {
      const endpoint = userType === 'provider'
        ? '/provider/bookings'
        : '/client/bookings';

      const response = await api.get(endpoint);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }

      return response.data.bookings;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      if (!Object.values(BOOKING_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const response = await api.put(`/provider/bookings/${id}/status`, {
        status,
        notes: notes || `Status updated to ${status}`
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update status');
      }

      return response.data.booking ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/client/bookings/${bookingId}/cancel`);
      return response.data.booking ?? { _id: bookingId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const addReview = createAsyncThunk(
  'bookings/addReview',
  async ({ bookingId, reviewData }, { rejectWithValue }) => {
    try {
      const payload = {
        score: Number(reviewData.rating),   // ensure numeric
        comment: reviewData.comment ?? reviewData.review ?? ''
      };
      const res = await api.post(`/client/bookings/${bookingId}/review`, payload);
      return res.data.booking ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data ?? { message: err.message || 'Network error' });
    }
  }
);

export const processPayment = createAsyncThunk(
  'booking/processPayment',
  async ({ bookingId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/payment`, paymentData);
      return response.data.booking ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Payment processing failed');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/user/history');
      return response.data.payments || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch payment history');
    }
  }
);

export const submitQuote = createAsyncThunk(
  'bookings/submitQuote',
  async ({ bookingId, quoteData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/provider/bookings/${bookingId}/quote`, quoteData);
      return response.data.booking ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit quote');
    }
  }
);

export const handleQuoteResponse = createAsyncThunk(
  'bookings/handleQuoteResponse',
  async ({ bookingId, approved, status }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/client/bookings/${bookingId}/quote-response`, {
        approved,
        status
      });

      if (!response.data.success) throw new Error(response.data.message);
      return response.data.booking ?? response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process quote response');
    }
  }
);

// --- Slice ---

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentBooking: null,
    realtimeUpdates: [],
    selectedBooking: null,
    trackingUpdates: []
  },
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    addNewBooking: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateBookingInRealtime: (state, action) => {
      const index = state.items.findIndex(b => b._id === action.payload._id);
      if (index !== -1) state.items[index] = action.payload;
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    clearRealtimeUpdates: (state) => {
      state.realtimeUpdates = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        state.items.unshift(action.payload);
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.selectedBooking?._id === action.payload._id)
          state.selectedBooking = action.payload;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index].status = 'cancelled';
      })
      .addCase(addReview.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.selectedBooking?._id === action.payload._id)
          state.selectedBooking = action.payload;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(submitQuote.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(handleQuoteResponse.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.selectedBooking?._id === action.payload._id)
          state.selectedBooking = action.payload;
      })
      .addMatcher(action => action.type.endsWith('/pending'), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(action => action.type.endsWith('/rejected'), (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Operation failed';
      })
      .addMatcher(action => action.type.endsWith('/fulfilled'), (state) => {
        state.loading = false;
        state.error = null;
      });
  }
});


const selectBookingState = (state) => state.booking || { items: [] };

export const selectAllBookings = createSelector(
  [selectBookingState],
  (bookingState) => bookingState.items || []
);

export const selectBookingById = createSelector(
  [selectAllBookings, (_, bookingId) => bookingId],
  (bookings, bookingId) => bookings.find((b) => b._id === bookingId)
);

export const selectBookingsError = (state) => state.booking.error;
export const selectBookingsLoading = (state) => state.booking.loading;
export const selectSelectedBooking = (state) => state.booking.selectedBooking;
export const selectCurrentBooking = (state) => state.booking.currentBooking;

export const {
  clearBookingError,
  addNewBooking,
  updateBookingInRealtime,
  setSelectedBooking,
  clearRealtimeUpdates
} = bookingSlice.actions;

export default bookingSlice.reducer;
