import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { showNotification } from './notificationSlice';

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/user/favorites');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch favorites' });
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (service, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/user/favorites', { serviceId: service._id });
      
      dispatch(showNotification({
        message: 'Service added to favorites',
        type: 'success'
      }));
      
      return {
        ...response.data,
        service 
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add to favorites' });
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (serviceId, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/user/favorites/${serviceId}`);
      
      dispatch(showNotification({
        message: 'Service removed from favorites',
        type: 'success'
      }));
      
      return { serviceId };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to remove from favorites' });
    }
  }
);

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {

    toggleFavorite: (state, action) => {
      const service = action.payload;
      const existingIndex = state.items.findIndex(item => item.serviceId === service._id);
      
      if (existingIndex !== -1) {

        state.items.splice(existingIndex, 1);
      } else {

        state.items.push({
          serviceId: service._id,
          service: {
            _id: service._id,
            title: service.title,
            description: service.description,
            price: service.price,
            imageUrl: service.imageUrl,
            averageRating: service.averageRating,
            reviewCount: service.reviewCount
          },
          provider: service.provider,
          addedOn: new Date().toISOString()
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch favorites';
      })
      
      .addCase(addFavorite.fulfilled, (state, action) => {
        const exists = state.items.some(item => item.serviceId === action.payload.serviceId);
        if (!exists) {
          state.items.push(action.payload);
        }
      })
      
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.serviceId !== action.payload.serviceId);
      });
  }
});

export const { toggleFavorite } = favoriteSlice.actions;

export default favoriteSlice.reducer;
