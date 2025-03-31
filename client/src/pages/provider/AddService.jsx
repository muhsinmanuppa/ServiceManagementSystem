import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createService, updateService } from '../../store/slices/serviceSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { validateService } from '../../utils/validation';

const AddService = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const categories = useSelector(state => state.category?.items) || []; // Add fallback
  const loading = useSelector(state => state.service.loading);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    // Cleanup preview URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      
      // Clear image error if exists
      if (formErrors.image) {
        setFormErrors({ ...formErrors, image: null });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateService(formData);
    
    if (!isValid) {
      const errorMessage = Object.values(errors)[0]; // Get first error
      dispatch(showNotification({
        type: 'error',
        message: errorMessage
      }));
      return;
    }

    if (!selectedFile) {
      errors.image = 'Please select an image for your service';
      setFormErrors(errors);
      return;
    }

    setUploading(true);
    
    try {
      const serviceFormData = new FormData();
      serviceFormData.append('title', formData.title.trim());
      serviceFormData.append('description', formData.description.trim());
      serviceFormData.append('price', formData.price);
      if (formData.category) {
        serviceFormData.append('category', formData.category);
      }
      // Change field name to match backend expectation
      serviceFormData.append('serviceImage', selectedFile);
      
      await dispatch(createService(serviceFormData)).unwrap();
      
      dispatch(showNotification({
        message: 'Service created successfully',
        type: 'success'
      }));
      
      navigate('/provider/services');
    } catch (error) {
      dispatch.showNotification({
        message: error.message || 'Error creating service',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Add New Service</h3>
      </div>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-8">
                <div className="mb-3">
                  <label className="form-label">Service Title *</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a clear and descriptive title"
                  />
                  {formErrors.title && (
                    <div className="invalid-feedback">{formErrors.title}</div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Description *</label>
                  <textarea
                    className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                    name="description"
                    rows="5"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your service in detail"
                  />
                  {formErrors.description && (
                    <div className="invalid-feedback">{formErrors.description}</div>
                  )}
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Price *</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {formErrors.price && (
                        <div className="invalid-feedback">{formErrors.price}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Selecting a relevant category helps clients find your service</small>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Service Image *</label>
                  <div className="card">
                    <div className="card-body text-center">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Service preview"
                          className="img-fluid mb-3"
                          style={{ maxHeight: '200px' }}
                        />
                      ) : (
                        <div className="placeholder-image bg-light d-flex flex-column align-items-center justify-content-center p-4 mb-3" style={{ height: '200px' }}>
                          <i className="bi bi-image text-muted fs-1"></i>
                          <p className="text-muted mb-0">Image preview</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className={`form-control ${formErrors.image ? 'is-invalid' : ''}`}
                        onChange={handleFileChange}
                        accept="image/*"
                      />
                      {formErrors.image && (
                        <div className="invalid-feedback d-block">{formErrors.image}</div>
                      )}
                      <small className="text-muted d-block mt-2">
                        Upload a clear, high-quality image that represents your service
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
                     
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/provider/services')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Service...
                  </>
                ) : (
                  'Create Service'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddService;
