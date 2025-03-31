import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProviderVerification = () => {
  const dispatch = useDispatch();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/verifications'); // Updated endpoint
      
      if (response.data.success) {
        setProviders(response.data.providers);
        console.log('Fetched providers:', response.data.providers);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch verifications'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (providerId, status) => {
    try {
      setProcessing(true);
      
      // Log the verification attempt
      console.log('Attempting verification:', { providerId, status, remarks });

      // Update the API endpoint to match the server route
      const response = await api.post(`/admin/verifications/${providerId}/handle`, {
        status,
        remarks: remarks.trim()
      });

      if (response.data.success) {
        dispatch(showNotification({
          type: 'success',
          message: response.data.message
        }));
        await fetchPendingVerifications();
        setSelectedProvider(null);
        setRemarks('');
      }
    } catch (error) {
      console.error('Verification error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to process verification'
      }));
    } finally {
      setProcessing(false);
    }
  };

  // Add validation for remarks when rejecting
  const canReject = remarks.trim().length > 0;

  // Add debug logging
  useEffect(() => {
    if (selectedProvider) {
      console.log('Selected provider document:', selectedProvider.document);
    }
  }, [selectedProvider]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <h2 className="my-4">Provider Verifications</h2>
      
      <div className="row">
        <div className="col-md-8">
          {providers.length === 0 ? (
            <div className="alert alert-info">No pending verifications</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Applied On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(provider => (
                    <tr key={provider._id}>
                      <td>{provider.name}</td>
                      <td>{provider.email}</td>
                      <td>{new Date(provider.verificationStatus?.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => setSelectedProvider(provider)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {selectedProvider && (
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Review Application</h5>
              </div>
              <div className="card-body">
                <h6>Business Description</h6>
                <p className="mb-4">{selectedProvider.description || 'No description provided'}</p>
                
                <h6>Verification Document</h6>
                <div className="mb-4">
                  {selectedProvider.document?.url ? (
                    <div className="mb-2">
                      <a 
                        href={selectedProvider.document.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-file-earmark-text me-2"></i>
                        View Document
                      </a>
                      <small className="text-muted d-block mt-1">
                        Uploaded: {new Date(selectedProvider.document.uploadedAt).toLocaleDateString()}
                      </small>
                    </div>
                  ) : (
                    <p className="text-muted">No document uploaded</p>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional remarks (required if rejecting)"
                  ></textarea>
                </div>
                
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success flex-grow-1"
                    onClick={() => handleVerification(selectedProvider._id, 'verified')}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="btn btn-danger flex-grow-1"
                    onClick={() => handleVerification(selectedProvider._id, 'rejected')}
                    disabled={processing || !canReject}
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderVerification;
