import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import { updateUser } from '../../store/slices/authSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Profile = () => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [localVerificationStatus, setLocalVerificationStatus] = useState(user?.verificationStatus?.status || null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    address: '',
    businessName: '',
    experience: ''
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    description: user?.description || '',
  });
  const [showVerificationForm, setShowVerificationForm] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/profiles/provider'); // Use new consistent endpoint
        
        if (response.data.success && response.data.user) {
          setProfile(prev => ({
            ...prev,
            ...response.data.user,
            name: response.data.user.name || user?.name || '',
            email: response.data.user.email || user?.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        dispatch(showNotification({
          type: 'error',
          message: 'Failed to load profile data'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?._id, dispatch]);

  useEffect(() => {
    setLocalVerificationStatus(user?.verificationStatus?.status || null);
  }, [user?.verificationStatus?.status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/profiles/provider', profile); // Use new consistent endpoint
      
      if (response.data.success) {
        dispatch(showNotification({
          type: 'success',
          message: 'Profile updated successfully'
        }));
        
        dispatch(updateUser(response.data.user));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      dispatch(showNotification({
        type: 'error', 
        message: error.response?.data?.message || 'Error updating profile'
      }));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(showNotification({
        message: 'New passwords do not match',
        type: 'error'
      }));
      return;
    }

    try {
      setSaving(true);
      await api.put('/users/change-password', passwordData);
      dispatch(showNotification({
        message: 'Password changed successfully',
        type: 'success'
      }));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      dispatch(showNotification({
        message: error.response?.data?.message || 'Failed to change password',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  const validateFileTypes = (fileList) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/i;
    const invalidFiles = Array.from(fileList).filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return !allowedTypes.test(extension);
    });
    
    return {
      valid: invalidFiles.length === 0,
      invalidFiles
    };
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    const validation = validateFileTypes(selectedFiles);
    if (!validation.valid) {
      const invalidFileNames = validation.invalidFiles.map(f => f.name).join(', ');
      dispatch(showNotification({
        type: 'error',
        message: `Invalid file type(s): ${invalidFileNames}. Only images, PDF, and Word documents are allowed.`
      }));
      e.target.value = '';
      setFiles([]);
      return;
    }
    
    setFiles(selectedFiles);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (submittingVerification) return;
  
    try {
      setSubmittingVerification(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('description', formData.description);
      if (files[0]) {
        formDataToSend.append('document', files[0]);
      }
  
      console.log('Submitting verification:', {
        description: formData.description,
        hasFile: !!files[0]
      });
  
      const response = await api.post('/provider/apply-verification', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      if (response.data.success) {
        dispatch(showNotification({
          type: 'success',
          message: 'Verification document submitted successfully'
        }));
        
        setLocalVerificationStatus('pending');
        if (response.data.verificationStatus) {
          dispatch(updateUser({
            ...user,
            verificationStatus: response.data.verificationStatus
          }));
        }
        
        setFormData({ description: '' });
        setFiles([]);
        setShowVerificationForm(false);
      }
    } catch (error) {
      console.error('Verification submission error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit verification'
      }));
    } finally {
      setSubmittingVerification(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <h3 className="mb-4">Provider Profile</h3>
      
      <div className="card">
        <div className="card-body">
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                class={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Information
              </button>
            </li>
            <li className="nav-item">
              <button 
                class={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
            </li>
          </ul>
          {activeTab === 'basic' && (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={profile.email}
                    disabled
                  />
                  <small className="text-muted">Email cannot be changed</small>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Business Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="businessName"
                  value={profile.businessName || ''}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  placeholder="Enter your mobile number"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control"
                  name="address"
                  value={profile.address || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter your business address"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-control"
                  name="experience"
                  value={profile.experience || ''}
                  onChange={handleChange}
                  min="0"
                  placeholder="Enter years of experience"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Bio/About</label>
                <textarea
                  className="form-control"
                  name="bio"
                  rows="4"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell clients about yourself and your business experience..."
                ></textarea>
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
          
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      {(user?.verificationStatus?.status !== 'verified' && showVerificationForm) && (
        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Verification Status</h5>
            <span className={`badge ${
              user?.verificationStatus?.status === 'pending' || localVerificationStatus === 'pending' 
              ? 'bg-warning' 
              : 'bg-danger'
            }`}>
              {localVerificationStatus || user?.verificationStatus?.status || 'Not Verified'}
            </span>
          </div>
          <div className="card-body">
            {user?.verificationStatus?.status === 'rejected' && localVerificationStatus !== 'pending' && (
              <div className="alert alert-danger mb-3">
                <h6>Verification Rejected</h6>
                <p>{user.verificationStatus.remarks || 'Your verification was rejected. Please address the issues and try again.'}</p>
              </div>
            )}
            {user?.verificationStatus?.status === 'pending' || localVerificationStatus === 'pending' ? (
              <div className="alert alert-info">
                <h6>Verification In Progress</h6>
                <p>Your verification request has been submitted and is under review. We'll notify you once it's complete.</p>
              </div>
            ) : (
              <form onSubmit={handleVerificationSubmit}>
                <div className="mb-3">
                  <label className="form-label">Business Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      description: e.target.value
                    })}
                    required
                    placeholder="Describe your business, services offered, and experience"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label">Upload Verification Document</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    required
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                  <small className="text-muted d-block mt-1">
                    Upload business registration or ID proof document
                  </small>
                  <small className="text-muted d-block">
                    Allowed file types: Images (.jpg, .png), PDF (.pdf), Word (.doc, .docx)
                  </small>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submittingVerification}
                >
                  {submittingVerification ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : 'Apply for Verification'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
