import React from 'react';

const RatingStars = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
  const handleClick = (selectedRating) => {
    if (!readonly && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const starSize = {
    sm: 'fs-6',
    md: 'fs-5',
    lg: 'fs-4'
  };

  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`bi ${star <= rating ? 'bi-star-fill' : 'bi-star'} 
            ${readonly ? '' : 'cursor-pointer'} 
            ${starSize[size] || starSize.md} me-1`}
          style={{ color: star <= rating ? '#ffc107' : '#e4e5e9' }}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
};

export default RatingStars;
