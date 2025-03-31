import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { login, clearRedirect } from "../../store/slices/authSlice";
import { showNotification } from "../../store/slices/notificationSlice";
import { validateEmail } from "../../utils/validation";
import PublicNavbar from '../../components/PublicNavbar';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error, isAuthenticated } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'provider':
        return '/provider';
      case 'client':
        return '/client';
      default:
        return '/';
    }
  };

  const handleLogin = async (values) => {
    try {
      const result = await dispatch(login(values));
      
      if (login.fulfilled.match(result)) {
        console.log('Login result:', result.payload);
        // Redirection will be handled by useEffect above
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      dispatch(showNotification({
        message: 'Please enter a valid email',
        type: 'error'
      }));
      return;
    }

    try {
      const result = await dispatch(login(formData)).unwrap();
      console.log('Login result:', result); // Add logging
    } catch (error) {
      console.error('Login error:', error); // Add logging
      dispatch(showNotification({
        message: error.message || 'Login failed',
        type: 'error',
        duration: 5000
      }));
    }
  };

  return (
    <>
      <PublicNavbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card mt-5">
              <div className="card-body">
                <h2 className="text-center mb-4">Login</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Login
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
