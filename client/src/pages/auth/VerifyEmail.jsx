import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;
      
      try {
        await api.get(`/auth/verify/${token}`);
        setVerified(true);
        dispatch(showNotification({
          message: "Email verified successfully! You can now log in.",
          type: "success"
        }));
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
      } catch (error) {
        dispatch(showNotification({
          message: error.response?.data?.message || "Verification failed",
          type: "error"
        }));
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, dispatch, navigate]);

  if (verifying) {
    return (
      <div className="container text-center py-5">
        <h2>Verifying your email...</h2>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body text-center">
              <h2>{verified ? "Email Verified!" : "Verification Failed"}</h2>
              
              {verified ? (
                <>
                  <div className="alert alert-success mt-3">
                    Your email has been successfully verified. You will be redirected to the login page shortly.
                  </div>
                  <div className="d-grid gap-2 col-6 mx-auto mt-3">
                    <Link to="/login" className="btn btn-primary">
                      Go to Login
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="alert alert-danger mt-3">
                    The verification link is invalid or has expired. Please try again or request a new verification email.
                  </div>
                  <div className="d-grid gap-2 col-6 mx-auto mt-3">
                    <Link to="/verify-otp" className="btn btn-primary">
                      Enter OTP
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
