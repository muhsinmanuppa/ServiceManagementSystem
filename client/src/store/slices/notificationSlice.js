import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    type: null,
    message: null,
    show: false
  },
  reducers: {
    showNotification: (state, action) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
      state.show = true;
    },
    hideNotification: (state) => {
      state.show = false;
      state.type = null;
      state.message = null;
    }
  }
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
