import { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createService, updateService } from '../../store/slices/serviceSlice';
import { showNotification } from '../../store/slices/notificationSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import ImageUpload from '../ImageUpload';
import LoadingSpinner from '../LoadingSpinner';

// Add this validation function above the component
const validateForm = (data) => {
  const errors = {};
  
  // Title validation
  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (data.title.length > 100) {
    errors.title = 'Title cannot exceed 100 characters';
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  } else if (data.description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  // Price validation
  const price = Number(data.price);
  if (!data.price || price <= 0) {
    errors.price = 'Price must be greater than 0';
  } else if (price > 1000000) {
    errors.price = 'Price cannot exceed ₹10,00,000';
  }

  // Category validation
  if (!data.category) {
    errors.category = 'Please select a category';
  }

  // Image validation
  if (!data.image && !data.existingImage) {
    errors.image = 'Please upload a service image';
  }

  return errors;
};

const ServiceForm = ({ service = null, onSuccess }) => {
  const dispatch = useDispatch();
  const { items: categories, loading: categoriesLoading } = useSelector(state => state.categories);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    images: [],
    ...service
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Updated form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      dispatch(showNotification({
        type: 'error',
        message: 'Please fix the form errors'
      }));
      return;
    }

    setFormLoading(true);
    try {
      const action = service ? updateService : createService;
      const payload = new FormData();

      // Append basic fields
      payload.append('title', formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('price', formData.price);
      payload.append('category', formData.category);

      // Handle single image upload
      if (formData.image instanceof File) {
        payload.append('serviceImage', formData.image);
      }

      // Handle existing image for updates
      if (service && formData.existingImage) {
        payload.append('existingImage', formData.existingImage);
      }

      if (service) {
        payload.append('id', service._id);
      }

      const result = await dispatch(action(payload)).unwrap();

      if (result.success) {
        dispatch(showNotification({
          type: 'success',
          message: `Service ${service ? 'updated' : 'created'} successfully`
        }));
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Service operation error:', error);
      dispatch(showNotification({
        type: 'error',
        message: error.message || `Failed to ${service ? 'update' : 'create'} service`
      }));
    } finally {
      setFormLoading(false);
    }
  };

  if (categoriesLoading) return <LoadingSpinner />;

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Title</Form.Label>
        <Form.Control
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          isInvalid={!!formErrors.title}
        />
        <Form.Control.Feedback type="invalid">
          {formErrors.title}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          isInvalid={!!formErrors.description}
        />
        <Form.Control.Feedback type="invalid">
          {formErrors.description}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Price (₹)</Form.Label>
        <Form.Control
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          required
          isInvalid={!!formErrors.price}
        />
        <Form.Control.Feedback type="invalid">
          {formErrors.price}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Category <span className="text-danger">*</span></Form.Label>
        <Form.Select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          required
          disabled={categoriesLoading || formLoading}
          isInvalid={!!formErrors.category}
        >
          <option value="">Select a category</option>
          {categories?.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          {formErrors.category}
        </Form.Control.Feedback>
        {categoriesLoading && (
          <Form.Text className="text-muted">
            Loading categories...
          </Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Images</Form.Label>
        <ImageUpload
          existingImages={service?.images || []}
          onImagesChange={(images) => setFormData({...formData, images})}
          maxImages={5}
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button type="submit" disabled={formLoading}>
          {formLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {service ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            service ? 'Update Service' : 'Create Service'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default ServiceForm;
