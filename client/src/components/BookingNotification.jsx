import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../store/slices/notificationSlice';
import { addNewBooking, updateBookingInRealtime } from '../store/slices/bookingSlice';

const BookingNotification = () => {
  const dispatch = useDispatch();
  const socket = useSelector(state => state.socket.socket);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (socket) {
      socket.on('booking:new', (booking) => {
        dispatch(addNewBooking(booking));
        if (user.role === 'provider') {
          dispatch(showNotification({
            type: 'info',
            message: 'New booking request received',
            duration: 5000
          }));
        }
      });

      socket.on('booking:statusUpdate', (booking) => {
        dispatch(updateBookingInRealtime(booking));
        const message = getStatusUpdateMessage(booking.status);
        dispatch(showNotification({
          type: 'info',
          message,
          duration: 5000
        }));
      });
    }

    return () => {
      if (socket) {
        socket.off('booking:new');
        socket.off('booking:statusUpdate');
      }
    };
  }, [socket, dispatch, user]);

  const getStatusUpdateMessage = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Booking has been confirmed';
      case 'in_progress':
        return 'Service is now in progress';
      case 'completed':
        return 'Service has been completed';
      case 'cancelled':
        return 'Booking has been cancelled';
      default:
        return 'Booking status updated';
    }
  };

  return null; 
};

export default BookingNotification;
