import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import api from '../../utils/api';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProviderManager = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      console.log('Fetching providers from /admin/verifications...');
      const response = await api.get('/admin/verifications');
      console.log('Server response:', response.data);
      
      let providerData = response.data.providers || response.data.data || response.data || [];
      console.log('Provider data received:', providerData);
      
      if (providerData.length > 0) {
        console.log('First provider complete data:', JSON.stringify(providerData[0], null, 2));
        console.log('First provider document field:', providerData[0].document);
        console.log('First provider description field:', providerData[0].description);
        console.log('All provider keys:', Object.keys(providerData[0]));
      }
      
      setProviders(Array.isArray(providerData) ? providerData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      console.error('Error response:', error.response);
      dispatch(showNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to fetch providers' 
      }));
      
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (providerId, status, remarks = '') => {
    try {
      console.log(`Submitting verification for ${providerId}:`, { status, remarks });
      const response = await api.post(`/admin/verifications/${providerId}/handle`, { 
        status, 
        remarks 
      });
      console.log('Verification response:', response.data);
      
      dispatch(showNotification({
        type: 'success',
        message: `Provider ${status === 'verified' ? 'verified' : 'rejected'} successfully`
      }));
      
      fetchProviders();
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response);
      dispatch(showNotification({ 
        type: 'error', 
        message: error.response?.data?.message || 'Action failed' 
      }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Provider Verification Requests</h2>
      
      {providers.length === 0 ? (
        <div className="alert alert-info">
          No pending verification requests
        </div>
      ) : (
        <div className="row">
          {providers.map(provider => (
            <div key={provider._id || provider.id} className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {provider.name || provider.businessName || 'Unknown Provider'}
                      <span className="badge bg-warning ms-2">
                        {provider.verificationStatus?.status || 'Pending'}
                      </span>
                    </h5>
                    <small>
                      Applied on: {
                        provider.verificationStatus?.updatedAt 
                          ? new Date(provider.verificationStatus.updatedAt).toLocaleDateString()
                          : provider.createdAt 
                          ? new Date(provider.createdAt).toLocaleDateString()
                          : 'N/A'
                      }
                    </small>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <p><strong>Email:</strong> {provider.email || 'N/A'}</p>
                      
                      {provider.businessName && (
                        <p><strong>Business Name:</strong> {provider.businessName}</p>
                      )}
                      
                      {provider.phone && (
                        <p><strong>Phone:</strong> {provider.phone}</p>
                      )}
                      
                      <p><strong>Business Description:</strong></p>
                      <p className="mb-4">
                        {provider.description || 'No description provided'}
                      </p>
                      
                      {provider.bio && (
                        <>
                          <p><strong>Bio:</strong></p>
                          <p className="mb-4">{provider.bio}</p>
                        </>
                      )}
                      
                      {provider.experience && (
                        <p><strong>Experience:</strong> {provider.experience} years</p>
                      )}
                      
                      <h6>Uploaded Document:</h6>
                      {provider.document && provider.document.url ? (
                        <div className="list-group mb-3">
                          <a 
                            href={provider.document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="list-group-item list-group-item-action"
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            {provider.document.originalName || 'Verification Document'}
                            <small className="text-muted d-block">
                              Format: {provider.document.format?.toUpperCase() || 'N/A'} | 
                              Uploaded: {provider.document.uploadedAt ? new Date(provider.document.uploadedAt).toLocaleDateString() : 'N/A'}
                            </small>
                          </a>
                        </div>
                      ) : (
                        <p className="text-muted mb-3">No document uploaded</p>
                      )}
                    </div>
                    
                    <div className="col-md-4 border-start">
                      <h6>Actions</h6>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success"
                          onClick={() => handleVerification(provider._id || provider.id, 'verified')}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Approve Provider
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            const remarks = window.prompt('Enter rejection reason:');
                            if (remarks) {
                              handleVerification(provider._id || provider.id, 'rejected', remarks);
                            }
                          }}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Reject Provider
                        </button>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => {/* view full profile */}}
                        >
                          <i className="bi bi-person me-2"></i>
                          View Full Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderManager;