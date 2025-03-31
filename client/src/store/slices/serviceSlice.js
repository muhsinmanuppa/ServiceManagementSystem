import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async ({ page = 1, limit = 10, search, filters } = {}) => {
    try {
      const params = {};
      if (page) params.page = page;
      if (limit) params.limit = limit;
      if (search) params.search = search;
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params[key] = value;
          }
        });
      }

      const urlParams = new URLSearchParams(params);
      const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';

      const response = await api.get(`/services${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }
);

export const fetchProviderServices = createAsyncThunk(
  'services/fetchProviderServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/provider/services');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch services' });
    }
  }
);

export const createService = createAsyncThunk(
  'services/createService',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('Creating service...', Object.fromEntries(formData));

      const response = await api.post('/provider/services', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Service creation response:', response.data);

      // Validate API response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid API response');
      }

      // Check if service data is returned
      if (!response.data.service) {
        return rejectWithValue(response.data.message || 'Service data missing in response');
      }

      return response.data.service; 
    } catch (error) {
      console.error('Service creation failed:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create service');
    }
  }
);

export const updateService = createAsyncThunk(
  'services/updateService',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.put(`/provider/services/${formData.get('id')}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update service');
      }

      return response.data.service;
    } catch (error) {
      console.error('Service update failed:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update service');
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id) => {
    await api.delete(`/services/${id}`);
    return id;
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState: {
    items: [],
    services: [],
    status: 'idle',
    loading: false,
    error: null,
    totalPages: 1,
    currentPage: 1
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch services cases
      .addCase(fetchServices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.services;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Fetch provider services
      .addCase(fetchProviderServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProviderServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload || [];
        state.items = action.payload || [];
      })
      .addCase(fetchProviderServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      
      .addCase(createService.fulfilled, (state, action) => {
        const newService = action.payload?.service || action.payload;
        
        // Ensure services and items are always arrays
        if (!Array.isArray(state.services)) state.services = [];
        if (!Array.isArray(state.items)) state.items = [];
      
        state.services.unshift(newService);
        state.items.unshift(newService);
      })
      

      // Update service
      .addCase(updateService.fulfilled, (state, action) => {
        const updatedService = action.payload;
        if (!updatedService) return;
        
        const updateArray = (arr) => {
          if (!Array.isArray(arr)) return;
          const index = arr.findIndex(s => s._id === updatedService._id);
          if (index !== -1) arr[index] = updatedService;
        };
        
        updateArray(state.services);
        updateArray(state.items);
      })

      // Delete service
      .addCase(deleteService.fulfilled, (state, action) => {
        const id = action.payload;
        if (Array.isArray(state.services)) {
          state.services = state.services.filter(item => item._id !== id);
        }
        if (Array.isArray(state.items)) {
          state.items = state.items.filter(item => item._id !== id);
        }
      });
  }
});

// Add selectors
export const selectServices = (state) => state.services.items;
export const selectServicesStatus = (state) => state.services.status;
export const selectServicesError = (state) => state.services.error;
export const selectServiceById = (state, id) =>
  state.services.items.find(service => service._id === id);

export default serviceSlice.reducer;
