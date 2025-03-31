import React, { useState } from 'react';
import RatingStars from './RatingStars';

const ReviewForm = ({ onSubmit, onCancel, initialRating = 0 }) => {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, review });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Rating</label>
        <RatingStars 
          rating={rating}
          onRatingChange={setRating}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Review</label>
        <textarea
          className="form-control"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows="3"
          required
          placeholder="Share your experience..."
        />
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!rating}>
          Submit Review
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
