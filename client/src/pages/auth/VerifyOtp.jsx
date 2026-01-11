import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyOtp, resendOtp } from '../../store/slices/authSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {

      navigate('/login');
    }
  }, [location, navigate]);


  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOtpChange = (e) => {
    const value = e.target.value;
    // Only allow up to 6 digits
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setOtp(value);
    }
  };

  const handleResendOtp = async () => {
    if (timeLeft > 0) return;
    
    try {
      setResendLoading(true);
      
      // Pass email as object to match the action parameter type
      await dispatch(resendOtp({ email })).unwrap();
      
      dispatch(showNotification({
        message: 'A new OTP has been sent to your email',
        type: 'success'
      }));
      
      // Start the cooldown timer
      setTimeLeft(60);
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Failed to resend OTP',
        type: 'error'
      }));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      dispatch(showNotification({
        message: 'Please enter a valid 6-digit OTP',
        type: 'warning'
      }));
      return;
    }

    try {
      setLoading(true);
      
      await dispatch(verifyOtp({ 
        email, 
        otp 
      })).unwrap();
      
      dispatch(showNotification({
        message: 'Email verified successfully',
        type: 'success'
      }));
      
      // Redirect to login page after successful verification
      navigate('/login');
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'OTP verification failed',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm mt-5">
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h3>Verify Your Email</h3>
                <p className="text-muted">
                  We sent a verification code to<br />
                  <strong>{email}</strong>
                </p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    maxLength="6"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="Enter OTP"
                    autoFocus
                  />
                  <div className="form-text">
                    Enter the 6-digit code sent to your email
                  </div>
                </div>
                
                <div className="d-grid mb-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : 'Verify OTP'}
                  </button>
                </div>
              </form>
              
              <div className="text-center">
                <p className="mb-0">
                  Didn't receive the code?{' '}
                  <button 
                    type="button" 
                    className="btn btn-link p-0"
                    onClick={handleResendOtp}
                    disabled={timeLeft > 0 || resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend'}
                  </button>
                  {timeLeft > 0 && (
                    <span className="text-muted ms-2">
                      ({timeLeft}s)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
