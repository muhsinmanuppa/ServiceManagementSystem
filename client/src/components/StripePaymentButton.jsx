import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPaymentIntent, verifyPayment } from '../store/slices/paymentSlice';
import { showNotification } from '../store/slices/notificationSlice';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment form component using Stripe Elements
const PaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  const dispatch = useDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        dispatch(showNotification({
          message: error.message || 'Payment failed',
          type: 'error'
        }));
        if (onError) onError(error);
        return;
      }

      // Verify payment on the server
      await dispatch(verifyPayment({
        bookingId,
        paymentData: {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        },
        provider: 'stripe'
      })).unwrap();

      dispatch(showNotification({
        message: 'Payment successful!',
        type: 'success'
      }));

      if (onSuccess) onSuccess(paymentIntent);
    } catch (error) {
      console.error('Payment error:', error);
      dispatch(showNotification({
        message: error.message || 'An error occurred during payment',
        type: 'error'
      }));
      if (onError) onError(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="d-grid mt-3">
        <button
          className="btn btn-primary"
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </form>
  );
};

// Main StripePaymentButton component
const StripePaymentButton = ({
  amount,
  bookingId,
  customerName,
  customerEmail,
  onSuccess,
  onError
}) => {
  const dispatch = useDispatch();
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createIntent = async () => {
      try {
        setLoading(true);
        const response = await dispatch(createPaymentIntent({
          bookingId,
          amount: Number(amount)
        })).unwrap();
        
        setClientSecret(response.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        dispatch(showNotification({
          message: error.message || 'Failed to set up payment',
          type: 'error'
        }));
        if (onError) onError(error);
      } finally {
        setLoading(false);
      }
    };

    if (amount && bookingId) {
      createIntent();
    }
  }, [dispatch, amount, bookingId, onError]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Setting up payment...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="alert alert-danger">
        Unable to initialize payment. Please try again or contact support.
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0d6efd',
      }
    }
  };

  return (
    <div className="stripe-payment-container p-3 border rounded">
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm 
          bookingId={bookingId}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
};

export default StripePaymentButton;
