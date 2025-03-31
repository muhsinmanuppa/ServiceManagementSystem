import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';

const Settings = () => {
  const dispatch = useDispatch();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      bookings: true,
      promotions: false
    },
    privacy: {
      shareActivity: true,
      shareContactInfo: false,
      allowLocationTracking: false
    },
    appearance: {
      theme: 'light',
      language: 'en',
      fontSize: 'medium'
    }
  });

  useEffect(() => {
    // Simulate fetching settings from API
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const handleChange = (section, name, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e, section) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // In a real app, you'd send to the API:
      // await api.put('/users/settings', { section, settings[section] });
      
      // For demo, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      dispatch(showNotification({
        message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`,
        type: 'success'
      }));
    } catch (error) {
      dispatch(showNotification({
        message: error.response?.data?.message || 'Error updating settings',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmDelete) {
      try {
        setSaving(true);
        
        // In a real app:
        // await api.delete('/users/account');
        
        // For demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        dispatch(showNotification({
          message: 'Account deletion request submitted',
          type: 'success'
        }));
        
        // Log the user out
        setTimeout(() => {
          logout();
        }, 1500);
      } catch (error) {
        dispatch(showNotification({
          message: error.response?.data?.message || 'Error processing account deletion',
          type: 'error'
        }));
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <h3 className="mb-4">Account Settings</h3>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Notification Preferences</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => handleSubmit(e, 'notifications')}>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotifications"
                      checked={settings.notifications.email}
                      onChange={(e) => handleChange('notifications', 'email', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      Email Notifications
                    </label>
                  </div>
                  <small className="form-text text-muted">Receive notifications via email</small>
                </div>
                
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="smsNotifications"
                      checked={settings.notifications.sms}
                      onChange={(e) => handleChange('notifications', 'sms', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="smsNotifications">
                      SMS Notifications
                    </label>
                  </div>
                  <small className="form-text text-muted">Receive notifications via text message</small>
                </div>
                
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="bookingNotifications"
                      checked={settings.notifications.bookings}
                      onChange={(e) => handleChange('notifications', 'bookings', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="bookingNotifications">
                      Booking Notifications
                    </label>
                  </div>
                  <small className="form-text text-muted">Receive updates about your bookings</small>
                </div>
                
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="promotionNotifications"
                      checked={settings.notifications.promotions}
                      onChange={(e) => handleChange('notifications', 'promotions', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="promotionNotifications">
                      Promotional Offers
                    </label>
                  </div>
                  <small className="form-text text-muted">Receive special offers and promotions</small>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Privacy Settings</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => handleSubmit(e, 'privacy')}>
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="shareActivity"
                      checked={settings.privacy.shareActivity}
                      onChange={(e) => handleChange('privacy', 'shareActivity', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="shareActivity">
                      Share Activity with Service Providers
                    </label>
                  </div>
                  <small className="form-text text-muted">Allow providers to see your booking history with them</small>
                </div>
                
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="shareContactInfo"
                      checked={settings.privacy.shareContactInfo}
                      onChange={(e) => handleChange('privacy', 'shareContactInfo', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="shareContactInfo">
                      Share Contact Information
                    </label>
                  </div>
                  <small className="form-text text-muted">Allow providers to see your contact details</small>
                </div>
                
                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="allowLocationTracking"
                      checked={settings.privacy.allowLocationTracking}
                      onChange={(e) => handleChange('privacy', 'allowLocationTracking', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="allowLocationTracking">
                      Allow Location Services
                    </label>
                  </div>
                  <small className="form-text text-muted">Enable location-based service recommendations</small>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Appearance Settings</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => handleSubmit(e, 'appearance')}>
                <div className="mb-3">
                  <label className="form-label">Theme</label>
                  <select 
                    className="form-select"
                    value={settings.appearance.theme}
                    onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">Use System Setting</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Language</label>
                  <select 
                    className="form-select"
                    value={settings.appearance.language}
                    onChange={(e) => handleChange('appearance', 'language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Font Size</label>
                  <select 
                    className="form-select"
                    value={settings.appearance.fontSize}
                    onChange={(e) => handleChange('appearance', 'fontSize', e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Appearance Settings'}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card border-danger">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0">Danger Zone</h5>
            </div>
            <div className="card-body">
              <h6>Delete Account</h6>
              <p className="text-muted">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button 
                className="btn btn-outline-danger"
                onClick={handleAccountDelete}
                disabled={saving}
              >
                {saving ? 'Processing...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
