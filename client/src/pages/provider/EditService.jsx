import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../store/slices/notificationSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../utils/api';

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both categories and service data in parallel
        const [categoriesRes, serviceRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/provider/services/${id}`)
        ]);

        if (!categoriesRes.data.categories) {
          throw new Error('Failed to load categories');
        }
        setCategories(categoriesRes.data.categories);

        if (!serviceRes.data.service) {
          throw new Error('Service not found');
        }

        const service = serviceRes.data.service;
        setFormData({
          title: service.title || '',
          description: service.description || '',
          price: service.price || '',
          category: service?.category?._id || service?.category || '',
          existingImage: service.imageUrl
        });

        if (service.imageUrl) {
          setImagePreview(service.imageUrl);
        }

      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Error loading service';
        setError(errorMsg);
        dispatch(showNotification({
          type: 'error',
          message: errorMsg
        }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { isValid, errors } = validateService(formData);
    
    if (!isValid) {
      setFormErrors(errors);
      dispatch(showNotification({
        type: 'error',
        message: Object.values(errors)[0]
      }));
      return;
    }

    setUploading(true);
    
    try {
      const serviceFormData = new FormData();
      serviceFormData.append('title', formData.title.trim());
      serviceFormData.append('description', formData.description.trim());
      serviceFormData.append('price', parseFloat(formData.price));
      if (formData.category) {
        serviceFormData.append('category', formData.category);
      }
      
      // Only append image if a new one is selected
      if (selectedFile) {
        serviceFormData.append('serviceImage', selectedFile);
      }

      await dispatch(updateService({ id, serviceData: serviceFormData })).unwrap();
      
      dispatch(showNotification({
        message: 'Service updated successfully',
        type: 'success'
      }));
      
      navigate('/provider/services');
    } catch (error) {
      console.error('Update error:', error);
      dispatch(showNotification({
        message: error.message || 'Error updating service. Please check file size and type.',
        type: 'error'
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setFormErrors({...formErrors, image: 'Please upload a valid image file (JPEG, PNG, or GIF)'});
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({...formErrors, image: 'Image size should be less than 5MB'});
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormErrors({...formErrors, image: null});
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-fluid px-4">
      <Card className="shadow-sm">
        <Card.Header>
          <h4 className="mb-0">Edit Service</h4>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Service Image</Form.Label>
              {previewUrl && (
                <div className="mb-2">
                  <img
                    src={previewUrl}
                    alt="Service preview"
                    className="img-thumbnail"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              <Form.Control
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
              />
              {formErrors.image && <div className="text-danger">{formErrors.image}</div>}
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={uploading}>
                {uploading ? 'Updating...' : 'Update Service'}
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/provider/services')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditService;
