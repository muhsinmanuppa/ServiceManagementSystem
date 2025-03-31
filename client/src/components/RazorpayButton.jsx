import { useState } from "react";
import { useDispatch } from "react-redux";
import { showNotification } from "../store/slices/notificationSlice";
import api from "../utils/api";

const RazorpayButton = ({ amount, bookingData, onSuccess, onError, className }) => {
  const [isPaid, setPaid] = useState(false);
  const [isProcessing, setProcessing] = useState(false);
  const dispatch = useDispatch();

  // Dynamically load the Razorpay checkout script if not already loaded
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    setProcessing(true);

    // Ensure Razorpay script is loaded
    const isRazorpayLoaded = await loadRazorpayScript();
    if (!isRazorpayLoaded) {
      dispatch(
        showNotification({
          type: "error",
          message: "Failed to load Razorpay. Try again.",
        })
      );
      setProcessing(false);
      return;
    }

    try {
      // Create order on your server using the datetime picker value (dateTime)
      const { data: order } = await api.post("/payments/create-order", {
        amount: amount * 100, // Convert rupees to paise
        bookingId: bookingData.bookingId,
        description: `Payment for ${bookingData.serviceTitle}`,
        notes: {
          // Using dateTime instead of a calendar view date
          dateTime: bookingData.dateTime,
          bookingNotes: bookingData.notes,
        },
      });

      // Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: order.amount,
        currency: "INR",
        order_id: order.id, // Ensure correct order id is used
        name: "Service Booking",
        description: `Booking: ${bookingData.serviceTitle} on ${bookingData.dateTime}`,
        handler: async (response) => {
          try {
            // Send payment details for verification to your server
            const verifyResponse = await api.post("/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingData.bookingId,
            });

            if (verifyResponse.data.success) {
              setPaid(true);
              dispatch(
                showNotification({
                  type: "success",
                  message: "Payment successful!",
                })
              );
              onSuccess && onSuccess(verifyResponse.data);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            dispatch(
              showNotification({
                type: "error",
                message: "Payment verification failed. Please contact support.",
              })
            );
            onError && onError(error);
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: bookingData.userName,
          email: bookingData.userEmail,
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: () => {
            dispatch(
              showNotification({
                type: "warning",
                message: "Payment process was canceled.",
              })
            );
            setProcessing(false);
            onError && onError(new Error("Payment cancelled by user"));
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      dispatch(
        showNotification({
          type: "error",
          message:
            error.response?.data?.message || "Payment initialization failed",
        })
      );
      onError && onError(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      className={`btn btn-primary ${className}`}
      onClick={handlePayment}
      disabled={isPaid || isProcessing}
    >
      {isProcessing
        ? "Processing..."
        : isPaid
        ? "Paid ✓"
        : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayButton;
