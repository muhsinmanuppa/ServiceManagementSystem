import { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const PaymentButton = ({ booking, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(state => state.auth);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/bookings/${booking._id}/payment/initiate`);
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID',
        amount: response.data.amount,
        currency: response.data.currency,
        name: "Service Booking",
        description: `Payment for ${booking.service.title}`,
        order_id: response.data.orderId,
        handler: function(response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onCancel && onCancel();
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setLoading(true);
      const response = await api.post('/bookings/verify-payment', paymentResponse);
      setLoading(false);
      
      if (response.data) {
        onSuccess && onSuccess(response.data);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <p className="mb-3">Total Amount: <strong>₹{booking.totalAmount || booking.amount}</strong></p>
      
      <button 
        className="btn btn-primary btn-lg"
        onClick={initiatePayment}
        disabled={loading}
      >
        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
        Pay Now
      </button>
      
      <p className="mt-3 text-muted small">
        <i className="bi bi-shield-check me-1"></i>
        Secure payment powered by Razorpay
      </p>
    </div>
  );
};

export default PaymentButton;
