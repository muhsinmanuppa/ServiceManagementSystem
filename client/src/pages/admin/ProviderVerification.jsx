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
      const response = await api.get('/admin/verifications');
      
      if (response.data.success) {
        setProviders(response.data.providers);
        console.log('Fetched providers:', response.data.providers);
        if (response.data.providers.length > 0) {
          console.log('First provider data:', response.data.providers[0]);
          console.log('First provider bio:', response.data.providers[0].bio);
          console.log('First provider businessName:', response.data.providers[0].businessName);
          console.log('First provider document:', response.data.providers[0].document);
        }
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
      
      console.log('Attempting verification:', { providerId, status, remarks });

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

  const canReject = remarks.trim().length > 0;

  useEffect(() => {
    if (selectedProvider) {
      console.log('Selected provider full data:', selectedProvider);
      console.log('Selected provider document:', selectedProvider.document);
      console.log('Selected provider bio:', selectedProvider.bio);
      console.log('Selected provider businessName:', selectedProvider.businessName);
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
                <div className="mb-3">
                  <h6>Provider Details</h6>
                  <p className="mb-1"><strong>Name:</strong> {selectedProvider.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedProvider.email}</p>
                  {selectedProvider.phone && (
                    <p className="mb-1"><strong>Phone:</strong> {selectedProvider.phone}</p>
                  )}
                  {selectedProvider.businessName && (
                    <p className="mb-1"><strong>Business:</strong> {selectedProvider.businessName}</p>
                  )}
                  {selectedProvider.experience && (
                    <p className="mb-1"><strong>Experience:</strong> {selectedProvider.experience} years</p>
                  )}
                  {selectedProvider.address && (
                    <p className="mb-1"><strong>Address:</strong> {selectedProvider.address}</p>
                  )}
                </div>

                <h6>Business Description</h6>
                <p className="mb-4">
                  {selectedProvider.description || selectedProvider.bio || 'No description provided'}
                </p>
                
                              
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
                        View Document ({selectedProvider.document.format?.toUpperCase() || 'File'})
                      </a>
                      <small className="text-muted d-block mt-1">
                        {selectedProvider.document.originalName || 'Verification Document'}
                      </small>
                      <small className="text-muted d-block">
                        Uploaded: {selectedProvider.document.uploadedAt ? new Date(selectedProvider.document.uploadedAt).toLocaleDateString() : 'N/A'}
                      </small>
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      No verification document uploaded. Ask provider to submit document through their profile.
                    </div>
                  )}
                </div>
                
                {selectedProvider.verificationStatus?.remarks && (
                  <div className="alert alert-secondary mb-3">
                    <strong>Previous Remarks:</strong> {selectedProvider.verificationStatus.remarks}
                  </div>
                )}
                
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
                    title={!canReject ? 'Remarks required for rejection' : ''}
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