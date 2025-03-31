import { Link } from 'react-router-dom';

const VerificationStatus = ({ status, remarks }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: 'bi-check-circle-fill',
          color: 'success',
          text: 'Verified Provider',
          showAction: false
        };
      case 'pending':
        return {
          icon: 'bi-clock-fill',
          color: 'warning',
          text: 'Verification Pending',
          subtext: 'Your application is under review',
          showAction: false
        };
      case 'rejected':
        return {
          icon: 'bi-x-circle-fill',
          color: 'danger',
          text: 'Verification Rejected',
          subtext: remarks,
          showAction: true
        };
      default:
        return {
          icon: 'bi-exclamation-triangle-fill',
          color: 'secondary',
          text: 'Not Verified',
          subtext: 'Complete verification to access all features',
          showAction: true
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`alert alert-${config.color} d-flex align-items-center`}>
      <i className={`bi ${config.icon} fs-4 me-2`}></i>
      <div className="flex-grow-1">
        <h5 className="alert-heading">{config.text}</h5>
        {config.subtext && <p className="mb-0">{config.subtext}</p>}
      </div>
      {config.showAction && (
        <Link to="/provider/profile" className="btn btn-sm btn-light ms-3">
          Complete Verification
        </Link>
      )}
    </div>
  );
};

export default VerificationStatus;
