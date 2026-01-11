import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createRequest } from '../store/slices/requestSlice';
import { showNotification } from '../store/slices/notificationSlice';

const RequestQuoteModal = ({ service, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    message: '',
    requestType: 'quote',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files).slice(0, 5);
      setAttachments(fileArray);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      dispatch(showNotification({
        message: 'Please describe your requirements',
        type: 'warning'
      }));
      return;
    }

    setLoading(true);
    
    try {
      const requestData = {
        serviceId: service._id,
        providerId: service.provider._id,
        requestType: formData.requestType,
        message: formData.message,
        attachments
      };
      
      await dispatch(createRequest(requestData)).unwrap();
      
      dispatch(showNotification({
        message: 'Your quote request has been sent! The provider will respond shortly.',
        type: 'success'
      }));
      
      onClose();
    } catch (error) {
      dispatch(showNotification({
        message: error.message || 'Failed to send quote request. Please try again.',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Request a Quote: {service.title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          
          <div className="modal-body">
            <div className="row mb-4">
              <div className="col-md-8">
                <h6>About This Service</h6>
                <p className="text-muted">{service.description}</p>
                <p>
                  <span className="fw-bold">Base Price:</span> ₹{service.price}
                  {service.priceRange && service.priceRange.min && (
                    <span className="text-muted ms-2">
                      (Range: ₹{service.priceRange.min} - 
                      {service.priceRange.max ? `₹${service.priceRange.max}` : 'Variable'})
                    </span>
                  )}
                </p>
                <p className="small text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Request a custom quote based on your specific requirements
                </p>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="rounded-circle bg-primary text-white p-2" style={{ width: '40px', height: '40px', textAlign: 'center' }}>
                          {service.provider.name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <h6 className="mb-0">{service.provider.name}</h6>
                        <p className="small text-muted mb-0">Service Provider</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Request Type</label>
                <select
                  className="form-select"
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleChange}
                >
                  <option value="quote">Price Quote</option>
                  <option value="information">Additional Information</option>
                  <option value="custom">Custom Request</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Describe Your Requirements *</label>
                <textarea
                  className="form-control"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide details about what you're looking for, including any specific requirements, timing, or preferences."
                  required
                ></textarea>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Attachments (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                />
                <small className="form-text text-muted">
                  Upload photos or documents to help explain your requirements (5 files max, 5MB each)
                </small>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestQuoteModal;
