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
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    address: ''
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/profile');
        
        if (response.data.success && response.data.user) {
          setProfile(prev => ({
            ...prev,
            ...response.data.user,
            name: response.data.user.name || '',
            email: response.data.user.email || '',
            phone: response.data.user.phone || '',
            bio: response.data.user.bio || '',
            address: response.data.user.address || ''
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
  }, [dispatch]);

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
      const response = await api.put('/users/profile', profile); // Use consistent endpoint
      
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
    
    // Basic validation
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
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      dispatch(showNotification({
        message: error.response?.data?.message || 'Failed to change password',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <h3 className="mb-4">My Profile</h3>
      
      <div className="card">
        <div className="card-body">
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Information
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
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
                  placeholder="Enter your address"
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Bio/About</label>
                <textarea
                  className="form-control"
                  name="bio"
                  rows="4"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
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
    </div>
  );
};

export default Profile;
