import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createBooking } from '../store/slices/bookingSlice';
import { showNotification } from '../store/slices/notificationSlice';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { Modal, Button, Form } from 'react-bootstrap';
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
      
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Failed to create booking',
        type: 'error'
      }));
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Book Service</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="mb-3">
            <h5>{service?.title}</h5>
            <p className="text-muted">₹{service?.price}</p>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Select Date and Time</Form.Label>
            <DatePicker
              selected={scheduledDate}
              onChange={setScheduledDate}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={new Date()}
              className="form-control"
              placeholderText="Select date and time"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Additional Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements..."
            />
          </Form.Group>

          {bookingData ? (
            <div className="mt-4">
              <div className="alert alert-info">
                <small>
                  Booking created successfully!
                </small>
              </div>
            </div>
          ) : (
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BookingModal;