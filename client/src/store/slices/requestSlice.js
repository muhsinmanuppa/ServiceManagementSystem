import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const createRequest = createAsyncThunk(
  'requests/createRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      Object.keys(requestData).forEach(key => {
        if (key !== 'attachments') {
          formData.append(key, requestData[key]);
        }
      });
      
      if (requestData.attachments && requestData.attachments.length) {
        requestData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      
      const response = await api.post('/requests', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create request' });
    }
  }
);

export const fetchRequests = createAsyncThunk(
  'requests/fetchRequests',
  async (userType, { rejectWithValue }) => {
    try {
      const response = await api.get(`/requests/${userType}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch requests' });
    }
  }
);

export const fetchRequestById = createAsyncThunk(
  'requests/fetchRequestById',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/requests/detail/${requestId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch request details' });
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'requests/updateStatus',
  async ({ requestId, status, quoteDetails = null }, { rejectWithValue }) => {
    try {
      const payload = { status };
      if (quoteDetails) {
        payload.quote = quoteDetails;
      }
      
      const response = await api.patch(`/provider/requests/${requestId}`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update request' });
    }
  }
);

export const addMessageToRequest = createAsyncThunk(
  'requests/addMessage',
  async ({ requestId, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/requests/${requestId}/message`, { message });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add message' });
    }
  }
);

export const fetchProviderRequests = createAsyncThunk(
  'requests/fetchProviderRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/provider/requests');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch requests' });
    }
  }
);

const requestSlice = createSlice({
  name: 'requests',
  initialState: {
    items: [],
    currentRequest: null,
    status: 'idle', 
    error: null,
    loading: false,
    actionLoading: false
  },
  reducers: {
    clearCurrentRequest: (state) => {
      state.currentRequest = null;
    },
    clearErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRequest.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.unshift(action.payload.request);
        state.currentRequest = action.payload.request;
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to create request';
      })
      
      .addCase(fetchRequests.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch requests';
      })
      
      .addCase(fetchRequestById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRequestById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentRequest = action.payload;
      })
      .addCase(fetchRequestById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message || 'Failed to fetch request details';
      })
      
      .addCase(updateRequestStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedRequest = action.payload.request;
        
        const index = state.items.findIndex(item => item._id === updatedRequest._id);
        if (index !== -1) {
          state.items[index] = updatedRequest;
        }
        
        if (state.currentRequest && state.currentRequest._id === updatedRequest._id) {
          state.currentRequest = updatedRequest;
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || { message: 'Failed to update request' };
      })
      
      .addCase(addMessageToRequest.fulfilled, (state, action) => {
        const updatedRequest = action.payload.request;
        
        const index = state.items.findIndex(item => item._id === updatedRequest._id);
        if (index !== -1) {
          state.items[index] = updatedRequest;
        }
        
        if (state.currentRequest && state.currentRequest._id === updatedRequest._id) {
          state.currentRequest = updatedRequest;
        }
      })
      
      .addCase(fetchProviderRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProviderRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to fetch requests' };
      });
  }
});

export const { clearCurrentRequest, clearErrors } = requestSlice.actions;

export const selectAllRequests = state => state.requests.items;
export const selectRequestById = (state, requestId) => 
  state.requests.items.find(request => request._id === requestId);
export const selectCurrentRequest = state => state.requests.currentRequest;
export const selectRequestsStatus = state => state.requests.status;
export const selectRequestsError = state => state.requests.error;

export default requestSlice.reducer;
