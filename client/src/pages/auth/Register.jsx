import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from '../../store/slices/authSlice';
import { showNotification } from "../../store/slices/notificationSlice";
import { validateEmail, validatePassword } from "../../utils/validation";
import PublicNavbar from '../../components/PublicNavbar';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client"
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const { confirmPassword: _, ...dataToSend } = formData;
      
      const result = await dispatch(register(dataToSend)).unwrap();
      console.log('Registration result:', result);
      
      dispatch(showNotification({
        message: result.emailSent 
          ? 'Registration successful. Please check your email for verification code.'
          : 'Registration successful but verification email could not be sent. Please try requesting a new code.',
        type: result.emailSent ? 'success' : 'warning'
      }));
      
      navigate("/verify-otp", { state: { email: formData.email } });
      
    } catch (error) {
      console.error('Registration error:', error);
      const errorMsg = error?.message || 'Registration failed. Please try again.';
      dispatch(showNotification({
        message: errorMsg,
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
    
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
    
    if (name === "password" || name === "confirmPassword") {
      if (name === "password" && formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors({...errors, confirmPassword: "Passwords do not match"});
      } else if (name === "confirmPassword" && value !== formData.password) {
        setErrors({...errors, confirmPassword: "Passwords do not match"});
      } else {
        setErrors({...errors, confirmPassword: null});
      }
    }
  };

  return (
    <><PublicNavbar />
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Register</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label d-block">Role</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleClient"
                      value="client"
                      checked={formData.role === "client"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="roleClient">
                      Client
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id="roleProvider"
                      value="provider"
                      checked={formData.role === "provider"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="roleProvider">
                      Service Provider
                    </label>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : 'Register'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Register;
