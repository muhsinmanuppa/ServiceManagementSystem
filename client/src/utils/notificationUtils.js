import { showNotification } from '../store/slices/notificationSlice';

// Helper to handle API errors globally
export const setupApiErrorHandler = (store) => {
  window.addEventListener('api-error', (event) => {
    if (store && store.dispatch) {
      store.dispatch(showNotification(event.detail));
    }
  });
};
