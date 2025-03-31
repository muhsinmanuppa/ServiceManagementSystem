import { useState } from 'react';

const BookingStatusModal = ({ booking, onClose, onUpdateStatus }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onUpdateStatus(booking._id, 'completed', notes);
      setLoading(false);
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Complete Service</h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              You're about to mark this booking as completed for:
              <strong> {booking.service.title}</strong>
            </p>
            <p>
              Client: <strong>{booking.client.name}</strong>
            </p>
            
            <div className="mb-3">
              <label htmlFor="completionNotes" className="form-label">Completion Notes (optional)</label>
              <textarea
                id="completionNotes"
                className="form-control"
                rows={3}
                placeholder="Add any details about the completed service..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn btn-success" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Complete Service'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatusModal;
