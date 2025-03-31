import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import api from '../../utils/api';

// Update booking status constants
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
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create booking');
    }
  }
);

// Update API endpoint to match server route
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (userType, { rejectWithValue }) => {
    try {
      // Fix API endpoint
      const endpoint = userType === 'provider' 
        ? '/provider/bookings' 
        : '/client/bookings';
      
      console.log('Fetching bookings from:', endpoint);
      const response = await api.get(endpoint);
      
      // Add debug logging
      console.log('Bookings response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }
      
      return response.data.bookings;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      // Validate status against constants
      if (!Object.values(BOOKING_STATUS).includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`);
      }

      const response = await api.put(`/provider/bookings/${id}/status`, {
        status,
        notes: notes || `Status updated to ${status}`
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update status');
      }

      return response.data.booking;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      // Update endpoint to match server route
      const response = await api.post(`/client/bookings/${bookingId}/cancel`);
      return { id: bookingId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const addReview = createAsyncThunk(
  'booking/addReview',
  async ({ bookingId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/client/bookings/${bookingId}/review`, {
        rating: Number(reviewData.rating),
        review: reviewData.comment
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to submit review');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
    }
  }
);

export const processPayment = createAsyncThunk(
  'booking/processPayment',
  async ({ bookingId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/payment`, paymentData);
      return response.data;
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

// Add submitQuote thunk
export const submitQuote = createAsyncThunk(
  'bookings/submitQuote',
  async ({ bookingId, quoteData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/provider/bookings/${bookingId}/quote`, quoteData);
      return response.data;
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

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to process quote response');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    items: [], // renamed from bookings to items for clarity
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
      state.realtimeUpdates.push({
        type: 'new',
        booking: action.payload,
        timestamp: new Date().toISOString()
      });
    },
    updateBookingInRealtime: (state, action) => {
      const index = state.items.findIndex(b => b._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
        state.realtimeUpdates.push({
          type: 'update',
          booking: action.payload,
          timestamp: new Date().toISOString()
        });
      }
    },
    clearRealtimeUpdates: (state) => {
      state.realtimeUpdates = [];
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    addTrackingUpdate: (state, action) => {
      if (state.selectedBooking?._id === action.payload.bookingId) {
        state.selectedBooking.tracking.push(action.payload.update);
      }
      state.trackingUpdates.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        // Add new booking to items array
        state.items.unshift(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create booking';
      })
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch bookings';
        state.items = [];
      })
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(booking => booking._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
          if (state.selectedBooking?._id === action.payload._id) {
            state.selectedBooking = action.payload;
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update booking status';
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.items.findIndex(booking => booking._id === action.payload.id);
        if (index !== -1) {
          state.items[index].status = 'cancelled';
        }
      })
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(b => b._id === action.payload.booking._id);
        if (index !== -1) {
          state.items[index] = action.payload.booking;
        }
        if (state.selectedBooking?._id === action.payload.booking._id) {
          state.selectedBooking = action.payload.booking;
        }
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit review';
      })
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(b => b._id === action.payload.booking._id);
        if (index !== -1) {
          state.items[index] = action.payload.booking;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Payment failed';
      })
      // Add quote cases
      .addCase(submitQuote.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(b => b._id === action.payload.booking._id);
        if (index !== -1) {
          state.items[index] = action.payload.booking;
        }
      })
      .addCase(submitQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit quote';
      })
      .addCase(handleQuoteResponse.fulfilled, (state, action) => {
        const index = state.items.findIndex(b => b._id === action.payload.booking._id);
        if (index !== -1) {
          state.items[index] = action.payload.booking;
        }
        if (state.selectedBooking?._id === action.payload.booking._id) {
          state.selectedBooking = action.payload.booking;
        }
      });
  }
});

// Create base selectors with safety checks
const selectBookingState = state => state.booking || { items: [] };

// Create memoized selectors
export const selectAllBookings = createSelector(
  [selectBookingState],
  bookingState => bookingState.items || []
);

export const selectBookingById = createSelector(
  [selectAllBookings, (_, bookingId) => bookingId],
  (bookings, bookingId) => bookings.find(booking => booking._id === bookingId)
);

export const selectBookingsByStatus = createSelector(
  [selectAllBookings, (_, status) => status],
  (bookings, status) => bookings.filter(booking => booking.status === status)
);

export const selectBookingsLoading = createSelector(
  [selectBookingState],
  bookingState => bookingState.loading
);

export const selectBookingsError = createSelector(
  [selectBookingState],
  bookingState => bookingState.error
);

export const selectSelectedBooking = createSelector(
  [selectBookingState],
  state => state.selectedBooking
);

export const selectBookingTracking = createSelector(
  [selectSelectedBooking],
  booking => booking?.tracking || []
);

export const selectCurrentBooking = createSelector(
  [selectBookingState],
  state => state.currentBooking
);

export const { 
  clearBookingError, 
  addNewBooking, 
  updateBookingInRealtime,
  clearRealtimeUpdates,
  setSelectedBooking,
  addTrackingUpdate
} = bookingSlice.actions;

export default bookingSlice.reducer;
