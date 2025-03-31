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
      const response = await api.get('/admin/provider-verifications');
      setProviders(response.data.providers);
    } catch (error) {
      dispatch(showNotification({ 
        type: 'error', 
        message: 'Failed to fetch providers' 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (providerId, status, remarks = '') => {
    try {
      await api.post(`/admin/provider-verification/${providerId}`, { 
        status, 
        remarks 
      });
      
      dispatch(showNotification({
        type: 'success',
        message: `Provider ${status === 'verified' ? 'verified' : 'rejected'} successfully`
      }));
      
      fetchProviders();
    } catch (error) {
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
            <div key={provider._id} className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {provider.name}
                      <span className="badge bg-warning ms-2">Pending</span>
                    </h5>
                    <small>Applied on: {new Date(provider.verificationStatus?.updatedAt).toLocaleDateString()}</small>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <p><strong>Email:</strong> {provider.email}</p>
                      <p><strong>Description:</strong></p>
                      <p className="mb-4">{provider.description}</p>
                      
                      <h6>Uploaded Documents:</h6>
                      <div className="list-group mb-3">
                        {provider.documents?.map((doc, index) => (
                          <a 
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="list-group-item list-group-item-action"
                          >
                            <i className="bi bi-file-earmark-text me-2"></i>
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                    
                    <div className="col-md-4 border-start">
                      <h6>Actions</h6>
                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success"
                          onClick={() => handleVerification(provider._id, 'verified')}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Approve Provider
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            const remarks = window.prompt('Enter rejection reason:');
                            if (remarks) {
                              handleVerification(provider._id, 'rejected', remarks);
                            }
                          }}
                        >
                          <i className="bi bi-x-circle me-2"></i>
                          Reject Provider
                        </button>
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => {/* Add view full profile logic */}}
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
