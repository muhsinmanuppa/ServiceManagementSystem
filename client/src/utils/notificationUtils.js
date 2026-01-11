import { showNotification } from '../store/slices/notificationSlice';

export const setupApiErrorHandler = (store) => {
  window.addEventListener('api-error', (event) => {
    if (store && store.dispatch) {
      store.dispatch(showNotification(event.detail));
    }
  });
};
