import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import serviceReducer from './slices/serviceSlice';
import notificationReducer from './slices/notificationSlice';
import socketReducer from './slices/socketSlice';
import bookingReducer from './slices/bookingSlice';
import categoryReducer from './slices/categorySlice';
import paymentReducer from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    service: serviceReducer,
    notification: notificationReducer,
    socket: socketReducer,
    booking: bookingReducer, // Make sure this is named 'booking' to match selectors
    category: categoryReducer, // Make sure this matches the slice name
    payment: paymentReducer, // Add this line if it's missing
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability checks
        ignoredActions: ['socket/initialize/fulfilled'],
        // Ignore these field paths for serializability checks
        ignoredPaths: ['socket.socket'],
      },
    }),
});

// Export store as default for easy importing
export default store;
