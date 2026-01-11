import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategories } from '../store/slices/categorySlice';

const CategoryList = ({ onSelectCategory, selectedCategory }) => {
  const dispatch = useDispatch();
  const { items: categories, status, error } = useSelector(state => state.categories);
  
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch, status]);
  
  return (
    <div className="categories-filter mb-4">
      <h5 className="mb-3">Browse Categories</h5>
      <div className="d-flex flex-wrap gap-2">
        <button
          className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onSelectCategory('')}
        >
          All Services
        </button>
        
        {categories.map(category => (
          <button
            key={category._id}
            className={`btn ${selectedCategory === category._id ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onSelectCategory(category._id)}
          >
            {category.name}
          </button>
        ))}
        
        {status === 'loading' && (
          <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
        )}
      </div>
      
      {error && (
        <div className="alert alert-warning mt-2 p-2 small">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Error loading categories
        </div>
      )}
    </div>
  );
};

export default CategoryList;
