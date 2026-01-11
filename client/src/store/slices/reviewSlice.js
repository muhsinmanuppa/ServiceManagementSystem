import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Fetch reviews for a service
export const fetchServiceReviews = createAsyncThunk(
  'reviews/fetchServiceReviews',
  async ({ serviceId, limit = 10, page = 1, sort = 'newest' }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/reviews/service/${serviceId}?limit=${limit}&page=${page}&sort=${sort}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch reviews' });
    }
  }
);

// Create a new review
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to submit review' });
    }
  }
);

// Update an existing review
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update review' });
    }
  }
);

// Delete a review
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      return { reviewId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete review' });
    }
  }
);

// Fetch user's own reviews
export const fetchUserReviews = createAsyncThunk(
  'reviews/fetchUserReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/client');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch your reviews' });
    }
  }
);

export const markReviewHelpful = createAsyncThunk(
  'reviews/markHelpful',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to mark review as helpful' });
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    serviceReviews: {
      items: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 1
      },
      ratingSummary: [],
      status: 'idle',
      error: null
    },
    userReviews: {
      items: [],
      status: 'idle',
      error: null
    }
  },
  reducers: {
    clearServiceReviews: (state) => {
      state.serviceReviews.items = [];
      state.serviceReviews.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceReviews.pending, (state) => {
        state.serviceReviews.status = 'loading';
      })
      .addCase(fetchServiceReviews.fulfilled, (state, action) => {
        state.serviceReviews.status = 'succeeded';
        state.serviceReviews.items = action.payload.reviews;
        state.serviceReviews.pagination = action.payload.pagination;
        state.serviceReviews.ratingSummary = action.payload.ratingSummary;
      })
      .addCase(fetchServiceReviews.rejected, (state, action) => {
        state.serviceReviews.status = 'failed';
        state.serviceReviews.error = action.payload?.message || 'Failed to fetch reviews';
      })
      
      .addCase(createReview.fulfilled, (state, action) => {
        state.serviceReviews.items.unshift(action.payload.review);
      })
      
      .addCase(updateReview.fulfilled, (state, action) => {
        const index = state.serviceReviews.items.findIndex(
          item => item._id === action.payload.review._id
        );
        if (index !== -1) {
          state.serviceReviews.items[index] = action.payload.review;
        }
        
        const userIndex = state.userReviews.items.findIndex(
          item => item._id === action.payload.review._id
        );
        if (userIndex !== -1) {
          state.userReviews.items[userIndex] = action.payload.review;
        }
      })
      
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.serviceReviews.items = state.serviceReviews.items.filter(
          item => item._id !== action.payload.reviewId
        );
        
        state.userReviews.items = state.userReviews.items.filter(
          item => item._id !== action.payload.reviewId
        );
      })
      
      .addCase(fetchUserReviews.pending, (state) => {
        state.userReviews.status = 'loading';
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.userReviews.status = 'succeeded';
        state.userReviews.items = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.userReviews.status = 'failed';
        state.userReviews.error = action.payload?.message || 'Failed to fetch user reviews';
      })
      
      .addCase(markReviewHelpful.fulfilled, (state, action) => {
        const { reviewId, helpfulCount } = action.payload;
        
        const index = state.serviceReviews.items.findIndex(item => item._id === reviewId);
        if (index !== -1) {
          state.serviceReviews.items[index].helpfulCount = helpfulCount;
        }
      });
  }
});

export const { clearServiceReviews } = reviewSlice.actions;

export default reviewSlice.reducer;
