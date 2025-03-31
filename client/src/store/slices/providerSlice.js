import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Rename fetchProviderStats to fetchStats for consistency
export const fetchStats = createAsyncThunk(
  'provider/fetchStats',
  async () => {
    const response = await api.get('/provider/stats');
    return response.data;
  }
);

export const applyForVerification = createAsyncThunk(
  'provider/applyForVerification',
  async (formData) => {
    const response = await api.post('/provider/apply-verification', formData);
    return response.data;
  }
);

const providerSlice = createSlice({
  name: 'provider',
  initialState: {
    stats: null,
    verificationStatus: null,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default providerSlice.reducer;
