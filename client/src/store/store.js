import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';
import paymentReducer from './slices/paymentSlice';
import bookingReducer from './slices/bookingSlice';
import socketReducer from './slices/socketSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    notification: notificationReducer,
    payment: paymentReducer,
    booking: bookingReducer,  
    socket: socketReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

// debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Redux store initialized with reducers:', 
    Object.keys(store.getState()).join(', '));
}

export default store;