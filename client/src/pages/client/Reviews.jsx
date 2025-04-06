import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';

const Reviews = () => {
  const dispatch = useDispatch();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    comment: ''
  });
  
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        // In a real app, fetch from API
        // const response = await api.get('/user/reviews');
        
        // Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockReviews = [
          {
            _id: 'rev1',
            service: {
              _id: 'svc1',
              title: 'House Cleaning',
              imageUrl: ''
            },
            provider: {
              _id: 'prov1',
              name: 'Clean Home Services'
            },
            rating: 5,
            comment: 'Excellent service! The cleaners were thorough and professional.',
            createdAt: new Date().toISOString(), // Today
            updatedAt: new Date().toISOString()
          },
          {
            _id: 'rev2',
            service: {
              _id: 'svc2',
              title: 'Plumbing Repair',
              imageUrl: ''
            },
            provider: {
              _id: 'prov2',
              name: 'Expert Plumbers Inc'
            },
            rating: 4,
            comment: 'Good work but took longer than expected to complete.',
            createdAt: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
            updatedAt: new Date(Date.now() - 604800000).toISOString()
          },
          {
            _id: 'rev3',
            service: {
              _id: 'svc3',
              title: 'Electrical Services',
              imageUrl: ''
            },
            provider: {
              _id: 'prov3',
              name: 'PowerPro Electric'
            },
            rating: 3,
            comment: 'The work was okay, but they left a mess afterwards.',
            createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
            updatedAt: new Date(Date.now() - 1209600000).toISOString()
          }
        ];
        
        setReviews(mockReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
        dispatch(showNotification({
          message: 'Failed to load your reviews',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
  }, [dispatch]);
  
  const handleEditStart = (review) => {
    setEditingReview(review._id);
    setEditForm({
      rating: review.rating,
      comment: review.comment
    });
  };
  
  const handleEditCancel = () => {
    setEditingReview(null);
  };
  
  const handleEditSubmit = async (reviewId) => {
    try {
      // In a real app:
      // await api.put(`/reviews/${reviewId}`, editForm);
      
      // For demo, update in state
      setReviews(reviews.map(rev => 
        rev._id === reviewId 
        ? {...rev, ...editForm, updatedAt: new Date().toISOString()} 
        : rev
      ));
      
      setEditingReview(null);
      
      dispatch(showNotification({
        message: 'Review updated successfully',
        type: 'success'
      }));
    } catch {
      dispatch(showNotification({
        message: 'Failed to update review',
        type: 'error'
      }));
    }
  };
  
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      // In a real app:
      // await api.delete(`/reviews/${reviewId}`);
      
      // For demo, remove from state
      setReviews(reviews.filter(rev => rev._id !== reviewId));
      
      dispatch(showNotification({
        message: 'Review deleted successfully',
        type: 'success'
      }));
    } catch {
      dispatch(showNotification({
        message: 'Failed to delete review',
        type: 'error'
      }));
    }
  };
  
  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.rating === parseInt(filter);
  });
  
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <i 
        key={index}
        className={`bi ${index < rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
      ></i>
    ));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>My Reviews</h3>
        
        <select 
          className="form-select w-auto"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>
      
      {reviews.length === 0 ? (
        <div className="text-center my-5 py-5">
          <i className="bi bi-star display-1 text-muted"></i>
          <h4 className="mt-3">No reviews yet</h4>
          <p className="text-muted mb-4">You haven't reviewed any services</p>
          <Link to="/" className="btn btn-primary">Book a Service</Link>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="alert alert-info">
          No reviews found matching your filter criteria
        </div>
      ) : (
        <div className="row">
          {filteredReviews.map(review => (
            <div key={review._id} className="col-12 mb-4">
              <div className="card">
                <div className="card-body">
                  {editingReview === review._id ? (
                    // Edit form
                    <div>
                      <div className="mb-3">
                        <label className="form-label">Your Rating</label>
                        <div>
                          {[5, 4, 3, 2, 1].map(num => (
                            <div key={num} className="form-check form-check-inline">
                              <input 
                                className="form-check-input" 
                                type="radio" 
                                name="rating" 
                                id={`rating${num}`} 
                                value={num} 
                                checked={editForm.rating === num}
                                onChange={() => setEditForm({...editForm, rating: num})}
                              />
                              <label className="form-check-label" htmlFor={`rating${num}`}>
                                {num} {num === 1 ? 'Star' : 'Stars'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Your Review</label>
                        <textarea 
                          className="form-control" 
                          value={editForm.comment}
                          onChange={e => setEditForm({...editForm, comment: e.target.value})}
                          rows="3"
                        ></textarea>
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleEditSubmit(review._id)}
                        >
                          Save Changes
                        </button>
                        <button 
                          className="btn btn-outline-secondary" 
                          onClick={handleEditCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Review display
                    <>
                      <div className="d-flex align-items-center">
                        <img 
                          src={review.service.imageUrl} 
                          alt={review.service.title}
                          className="rounded me-3"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                          }}
                        />
                        <div>
                          <h5 className="card-title mb-1">
                            <Link to={`/services/${review.service._id}`}>
                              {review.service.title}
                            </Link>
                          </h5>
                          <p className="text-muted mb-0">
                            <small>
                              Provider: {review.provider.name} • 
                              {new Date(review.createdAt).toLocaleDateString()}
                              {review.createdAt !== review.updatedAt && ' (edited)'}
                            </small>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 mb-2">
                        {renderStars(review.rating)}
                      </div>
                      <p className="card-text">{review.comment}</p>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditStart(review)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          <i className="bi bi-trash me-1"></i> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
