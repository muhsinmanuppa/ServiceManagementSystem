import { createSelector } from 'reselect';
import { selectAllBookings } from './bookingSlice';

// Memoized filter selectors
export const selectFilteredBookings = createSelector(
  [selectAllBookings, (_, filters) => filters],
  (bookings, filters) => {
    if (!filters) return bookings;

    return bookings.filter(booking => {
      const dateMatch = !filters.date || booking.date === filters.date;
      const statusMatch = !filters.status || booking.status === filters.status;
      return dateMatch && statusMatch;
    });
  }
);

export const selectBookingsStats = createSelector(
  [selectAllBookings],
  (bookings) => ({
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length
  })
);
