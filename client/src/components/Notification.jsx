import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideNotification } from '../store/slices/notificationSlice';

const Notification = () => {
  const { message, show, type, duration } = useSelector(state => state.notification);
  const dispatch = useDispatch();

  useEffect(() => {
    if (show && duration) {
      const timer = setTimeout(() => {
        dispatch(hideNotification());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, dispatch, duration]);

  if (!show) return null;

  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'alert-success';
      case 'error': return 'alert-danger';
      case 'warning': return 'alert-warning';
      default: return 'alert-info';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-exclamation-triangle-fill';
      case 'warning': return 'bi-exclamation-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  };

  return (
    <div className="notification-wrapper">
      <div className={`alert ${getTypeClass()} d-flex align-items-center`} role="alert">
        <i className={`bi ${getIcon()} me-2`}></i>
        <div className="flex-grow-1">{message}</div>
        <button 
          type="button" 
          className="btn-close ms-3"
          onClick={() => dispatch(hideNotification())}
          aria-label="Close"
        ></button>
      </div>

      <style jsx="true">{`
        .notification-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1050;
          min-width: 300px;
          max-width: 500px;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Notification;
