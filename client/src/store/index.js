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
    booking: bookingReducer, 
    category: categoryReducer, 
    payment: paymentReducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/initialize/fulfilled'],
        ignoredPaths: ['socket.socket'],
      },
    }),
});

export default store;
