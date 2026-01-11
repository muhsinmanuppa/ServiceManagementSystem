import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import { 
  addReview, 
  processPayment, 
  selectBookingById, 
  handleQuoteResponse,
  BOOKING_STATUS  
} from '../../store/slices/bookingSlice';
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
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const existingBooking = useSelector(state => selectBookingById(state, id));

  const defaultImageUrl = 'https://placehold.co/100x100/eee/999?text=Service';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching booking details for ID:', id);

        const response = await api.get(`/client/bookings/${id}`);
        console.log('Booking response (raw):', response);

        const data = response.data;
        const bookingPayload = data?.booking ?? data;
        if (!bookingPayload) {
          throw new Error('No booking data received from server');
        }

        setBooking(bookingPayload);
        setError(null);
      } catch (error) {
        console.error('Error fetching booking:', error, error.response?.data);
        setError('Failed to fetch booking details');
        dispatch(showNotification({ type: 'error', message: error.response?.data?.message || 'Failed to fetch booking details' }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id, dispatch]);

  useEffect(() => {
    console.log('Current booking state:', booking);
  }, [booking]);

  useEffect(() => {
    if (existingBooking) {
      setBooking(existingBooking);
    }
  }, [existingBooking]);

  const handleSubmitReview = async (reviewData) => {
    try {
      if (!booking) {
        throw new Error('Booking not loaded');
      }
      if (booking.status !== 'completed') {
        throw new Error('Booking is not completed and cannot be reviewed');
      }
      if (!reviewData.rating || !reviewData.comment.trim()) {
        throw new Error('Please provide both rating and comment');
      }

      console.log('Submitting review', { bookingId: id, reviewData });

      const result = await dispatch(addReview({
        bookingId: id,
        reviewData: {
          rating: Number(reviewData.rating),
          comment: reviewData.comment.trim()
        }
      })).unwrap();

      console.log('addReview result:', result);

      const updatedBooking = result?.booking ?? result;
      if (updatedBooking) {
        setBooking(updatedBooking);
      }

      setShowReviewForm(false);
      setRating(0);
      setComment('');

      dispatch(showNotification({
        type: 'success',
        message: 'Review submitted successfully'
      }));
    } catch (error) {
      console.error('Review submit error:', error, error?.payload ?? error.response?.data);
      const serverMessage =
        error?.payload?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit review';
      dispatch(showNotification({ type: 'error', message: serverMessage }));
    }
  };

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);
      
      const orderResponse = await api.post('/payments/create-order', {
        bookingId: booking._id,
        amount: booking.quote?.price || booking.totalAmount
      });

      if (!orderResponse.data.success) {
        throw new Error('Failed to create order');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "Service Booking",
        description: `Payment for ${booking.service?.title}`,
        order_id: orderResponse.data.orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await api.post('/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });

            if (verifyResponse.data.success) {
              const updatedBookingResponse = await api.get(`/client/bookings/${booking._id}`);
              setBooking(updatedBookingResponse.data);
              
              dispatch(showNotification({
                type: 'success',
                message: 'Payment successful!'
              }));
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            dispatch(showNotification({
              type: 'error',
              message: error.response?.data?.message || 'Payment verification failed'
            }));
          }
        },
        prefill: {
          name: booking.client?.name,
          email: booking.client?.email
        },
        theme: {
          color: "#3399cc"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Payment initialization failed'
      }));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // const canShowPaymentButton = () => {
  //   return (
  //     booking.status === BOOKING_STATUS.QUOTED && 
  //     (!booking.payment || booking.payment.status !== 'paid') &&
  //     !isProcessingPayment
  //   );
  // };

const canShowPaymentButton = () => {
  const paymentStatus = booking?.payment?.status;

  return (
    paymentStatus !== 'paid' && 
    (
      booking.status !== BOOKING_STATUS.PENDING ||
      paymentStatus === 'pending'
    ) &&
    !isProcessingPayment
  );
};



  const canSubmitReview = () => {
    const paymentStatus = String(booking?.payment?.status || '').toLowerCase();
    const paidLike = ['paid', 'completed', 'success'].includes(paymentStatus);
    // allow submit OR update when booking is completed and payment is okay
    return (
      booking?.status === 'completed' &&
      paidLike
    );
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!booking) return <div className="alert alert-warning">Booking not found</div>;

  const showPaymentOption = booking?.status === 'pending' && booking?.payment?.status === 'pending';
  const showReviewOption = () => canSubmitReview();

  return (
    <div className="container-fluid px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Booking Details</h2>
        <button className="btn btn-outline-secondary" onClick={() => navigate('/client/bookings')}>
          Back to Bookings
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Booking #{booking._id?.substr(-6).toUpperCase()}</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-4 mb-md-0">
              <h5>Service Information</h5>
              <div className="d-flex mb-3">
                <img 
                  src={(booking.service?.imageUrl) || defaultImageUrl} 
                  alt={booking.service?.title || 'Service'}
                  className="rounded me-3"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImageUrl;
                  }}
                />
                <div>
                  <h5>{booking.service?.title || 'Unknown Service'}</h5>
                  <p className="text-muted mb-1">{booking.service?.category?.name || 'Uncategorized'}</p>
                  <p className="mb-1">{booking.service?.description?.substring(0, 100) || 'No description available'}</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h5>Provider Information</h5>
              <div className="d-flex align-items-center mb-3">
                <div>
                  <h6 className="mb-0">{booking.provider?.name || 'Unknown Provider'}</h6>
                  <p className="text-muted mb-0">{booking.provider?.email || 'No email available'}</p>
                </div>
              </div>
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="col-md-6 mb-4 mb-md-0">
              <h5>Booking Details</h5>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Status</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(booking.status)}`}>
                        {booking.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Date & Time</td>
                    <td>{new Date(booking.scheduledDate).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Duration</td>
                    <td>{booking.duration || '1'} hour(s)</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Location</td>
                    <td>{booking.location || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Created On</td>
                    <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Notes</td>
                    <td>{booking.notes || 'No notes'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5>Payment Information</h5>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Amount</td>
                    <td>₹{booking.totalAmount || booking.amount || 0}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Payment Status</td>
                    <td>
                      <span className={`badge ${booking.payment?.status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                        {booking.payment?.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                  {booking.payment?.method && (
                    <tr>
                      <td className="fw-bold">Payment Method</td>
                      <td>{booking.payment.method}</td>
                    </tr>
                  )}
                  {booking.payment?.transactionId && (
                    <tr>
                      <td className="fw-bold">Transaction ID</td>
                      <td>{booking.payment.transactionId}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2">


            {canShowPaymentButton() && (
              <button 
                className="btn btn-success"
                onClick={handlePayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : `Pay Now ₹${booking.quote?.price || booking.totalAmount}`}
              </button>
            )}
            
            {booking.payment?.status === 'paid' && (
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowInvoice(true)}
              >
                View Invoice
              </button>
            )}

            {canSubmitReview() && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setRating(Number(booking.rating?.score ?? 0)); 
                  setComment(booking.rating?.comment ?? booking.rating?.review ?? '');
                  setShowReviewForm(true);
                }}
              >
                {booking.rating ? 'Edit Review' : 'Add Review'}
              </button>
            )}
          </div>

          {booking.rating && (
            <div className="d-flex align-items-center">
              <span className="me-2">Your Rating:</span>
              <RatingStars 
                rating={booking.rating.score}
                readonly={true}
                size="sm"
              />
            </div>
          )}
        </div>
      </div>

      <InvoiceView 
        show={showInvoice}
        onHide={() => setShowInvoice(false)}
        booking={booking}
      />

      {showReviewForm && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{booking.rating ? 'Update Review' : 'Add Review'}</h5>
                <button type="button" className="btn-close" onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment('');
                }}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitReview({ 
                    rating: parseInt(rating), 
                    comment 
                  });
                }}>
                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <div className="star-rating">
                      <RatingStars
                        rating={Number(rating) || 0}
                        onRatingChange={(r) => setRating(Number(r))}
                        readonly={false}
                        size="md"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      minLength={10}
                      maxLength={500}
                    ></textarea>
                    <small className="text-muted">
                      {comment.length}/500 characters
                    </small>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button 
                      type="button" 
                      className="btn btn-secondary me-2" 
                      onClick={() => {
                        setShowReviewForm(false);
                        setRating(0);
                        setComment('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={!rating || !comment.trim()}
                    >
                      {booking.rating ? 'Update Review' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowPaymentForm(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  Payment integration would go here. For now, click the button to simulate payment.
                </div>
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-success"
                    onClick={() => handlePayment({ method: 'card', status: 'paid' })}
                  >
                    Complete Payment
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
