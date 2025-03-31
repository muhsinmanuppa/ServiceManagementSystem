import { showNotification } from '../slices/notificationSlice';

export const errorMiddleware = ({ dispatch }) => (next) => (action) => {
  if (action.type.endsWith('/rejected')) {
    const errorMessage = action.error.message || 'An error occurred';
    dispatch(showNotification({
      message: errorMessage,
      type: 'error'
    }));
  }
  return next(action);
};
