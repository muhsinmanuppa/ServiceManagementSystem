import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import { updateBookingStatus, submitQuote, BOOKING_STATUS } from '../../store/slices/bookingSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import InvoiceView from '../../components/InvoiceView';

const BookingDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/provider/bookings/${id}`);
        setBooking(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError('Failed to fetch booking details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  useEffect(() => {
    // Auto-start service when payment is completed
    if (booking?.status === BOOKING_STATUS.QUOTED && 
        booking?.payment?.status === 'paid') {
      handleStatusUpdate(BOOKING_STATUS.IN_PROGRESS);
    }
  }, [booking?.payment?.status]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      await dispatch(updateBookingStatus({
        id,
        status: newStatus,
        notes: `Service ${newStatus.replace('_', ' ')} by provider`
      })).unwrap();

      setBooking(prev => ({ ...prev, status: newStatus }));
      dispatch(showNotification({
        type: 'success',
        message: 'Booking status updated successfully'
      }));
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.message || 'Failed to update status'
      }));
    }
  };

  const handleQuoteSubmit = async (quoteData) => {
    try {
      const result = await dispatch(submitQuote({ bookingId: id, quoteData })).unwrap();
      setBooking(result.booking);
      setShowQuoteModal(false);
      dispatch(showNotification({
        type: 'success',
        message: 'Quote submitted successfully'
      }));
    } catch (error) {
      dispatch.showNotification({
        type: 'error',
        message: error.message || 'Failed to submit quote'
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case BOOKING_STATUS.PENDING:
        return 'secondary';
      case BOOKING_STATUS.QUOTED:
        return 'info';
      case BOOKING_STATUS.IN_PROGRESS:
        return 'primary';
      case BOOKING_STATUS.COMPLETED:
        return 'success';
      default:
        return 'dark';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!booking) return <div className="alert alert-warning">Booking not found</div>;

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Booking Details</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => navigate('/provider/bookings')}
        >
          Back to Bookings
        </button>
      </div>

      {/* Add Client Details Card */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Client Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="fw-bold">Name:</label>
                <p className="mb-1">{booking.client?.name}</p>
              </div>
              <div className="mb-3">
                <label className="fw-bold">Email:</label>
                <p className="mb-1">{booking.client?.email}</p>
              </div>
              <div className="mb-3">
                <label className="fw-bold">Phone:</label>
                <p className="mb-1">{booking.client?.phone || 'Not provided'}</p>
              </div>
              <div className="mb-3">
                <label className="fw-bold">Address:</label>
                <p className="mb-1">{booking.client?.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Service Status Card */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Work Status</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="fw-bold">Current Status:</label>
                <div className="mt-2">
                  <span className={`badge bg-${getStatusBadgeColor(booking.status)} fs-6`}>
                    {booking.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <label className="fw-bold">Status History:</label>
                <div className="timeline mt-3">
                  {booking.tracking?.map((track, index) => (
                    <div key={index} className="timeline-item mb-3">
                      <div className="d-flex align-items-start">
                        <div className={`timeline-marker bg-${getStatusBadgeColor(track.status)}`}></div>
                        <div className="ms-3">
                          <div className="fw-bold">{track.status?.toUpperCase()}</div>
                          <div className="text-muted small">
                            {new Date(track.timestamp).toLocaleString()}
                          </div>
                          {track.notes && <div className="mt-1">{track.notes}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add some CSS for the timeline */}
      <style>{`
        .timeline-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 5px;
        }
        .timeline-item {
          position: relative;
        }
        .timeline-item:not(:last-child):before {
          content: '';
          position: absolute;
          left: 5px;
          top: 15px;
          bottom: -15px;
          width: 2px;
          background-color: #e9ecef;
        }
      `}</style>

      <div className="card-footer d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2">
          {booking.status === BOOKING_STATUS.PENDING && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setShowQuoteModal(true)}
              >
                Submit Quote
              </button>
            </>
          )}

          {booking.status === BOOKING_STATUS.IN_PROGRESS && (
            <button
              className="btn btn-success"
              onClick={() => handleStatusUpdate(BOOKING_STATUS.COMPLETED)}
            >
              Complete Service
            </button>
          )}

          {(booking.quote || booking.payment?.status === 'paid') && (
            <button 
              className="btn btn-outline-primary"
              onClick={() => setShowInvoice(true)}
            >
              View Invoice
            </button>
          )}
        </div>
      </div>

      {/* Add modals */}
      <InvoiceView 
        show={showInvoice}
        onHide={() => setShowInvoice(false)}
        booking={booking}
      />

      {/* Add Quote Modal */}
      {showQuoteModal && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit Quote</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowQuoteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleQuoteSubmit({
                    price: e.target.price.value,
                    estimatedHours: e.target.estimatedHours.value,
                    notes: e.target.notes.value
                  });
                }}>
                  <div className="mb-3">
                    <label className="form-label">Price (₹)</label>
                    <input 
                      type="number" 
                      name="price" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estimated Hours</label>
                    <input 
                      type="number" 
                      name="estimatedHours" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea 
                      name="notes" 
                      className="form-control" 
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowQuoteModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Quote
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
