import React from 'react';

const Alert = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      {onClose && (
        <button 
          type="button" 
          className="btn-close" 
          onClick={onClose}
        ></button>
      )}
    </div>
  );
};

export default Alert;
