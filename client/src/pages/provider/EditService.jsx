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
    try {
      const data = new FormData();
      data.append('id', id);
      
      // Only append changed fields
      Object.keys(formData).forEach(key => {
        if (key === 'image' && formData[key]) {
          data.append('serviceImage', formData[key]);
        } else if (key !== 'existingImage' && formData[key]) {
          data.append(key, formData[key]);
        }
      });

      const response = await api.put(`/provider/services/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        dispatch(showNotification({
          type: 'success',
          message: 'Service updated successfully'
        }));
        navigate('/provider/services');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error updating service';
      dispatch(showNotification({
        type: 'error',
        message: errorMsg
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
              {imagePreview && (
                <div className="mb-2">
                  <img
                    src={imagePreview}
                    alt="Service preview"
                    className="img-thumbnail"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              <Form.Control
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit">
                Update Service
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
