import React from 'react';
import { timeSince } from '../utils/serviceUtils';

const ServiceReview = ({ review }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <i 
        key={index}
        className={`bi ${index < rating ? 'bi-star-fill' : 'bi-star'} text-warning`}
      ></i>
    ));
  };

  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex">
            <div className="me-3">
              <div className="bg-primary text-white rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {review.client?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div>
              <h6 className="mb-0">{review.client?.name || 'Anonymous'}</h6>
              <div className="mb-1">
                {renderStars(review.rating)}
                <span className="ms-2 text-muted small">
                  {timeSince(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          {review.verified && (
            <span className="badge bg-success">
              <i className="bi bi-check-circle me-1"></i>
              Verified Booking
            </span>
          )}
        </div>
        
        <p className="mt-3 mb-0">{review.comment}</p>
        
        {review.providerResponse && (
          <div className="mt-3 p-3 bg-light rounded">
            <div className="fw-bold mb-1">Response from provider:</div>
            <p className="mb-0 small">{review.providerResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceReview;
