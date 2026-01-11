import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBooking } from '../store/slices/bookingSlice';
import { showNotification } from '../store/slices/notificationSlice';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const BookingModal = ({ show, onHide, service, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const response = await api.get('/users/profile');
          setUserProfile(response.data);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduledDate) {
      dispatch(showNotification({
        message: 'Please select date and time',
        type: 'warning'
      }));
      return;
    }

    try {
      setLoading(true);
      
      const bookingPayload = {
        serviceId: service._id,
        scheduledDate: scheduledDate.toISOString(),
        notes: notes.trim(),
        amount: service.price
      };
      
      const createdBooking = await dispatch(createBooking(bookingPayload)).unwrap();
      setBookingData(createdBooking);
      setLoading(false);

      dispatch(showNotification({
        message: 'Booking created successfully!',
        type: 'success'
      }));
  
      // Reset form fields
      setScheduledDate(null);
      setNotes('');
      setBookingData(null);
  
      // Close the modal
      onHide();
  
      if (onSuccess) onSuccess(createdBooking);
      
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Failed to create booking',
        type: 'error'
      }));
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">Book Service</h3>
          <button 
            onClick={onHide}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <h5 className="text-lg font-medium">{service?.title}</h5>
              <p className="text-gray-500">₹{service?.price}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date and Time
              </label>
              <DatePicker
                selected={scheduledDate}
                onChange={setScheduledDate}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date and time"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {bookingData ? (
              <div className="mt-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                  <p className="text-sm">
                    Booking created successfully!
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Booking...' : 'Create Booking'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;