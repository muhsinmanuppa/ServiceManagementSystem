import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card } from 'react-bootstrap';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ServiceSearch = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    ...initialFilters
  });

  const [location, setLocation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location error:', error)
      );
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const searchParams = { ...filters };
    
    if (location) {
      searchParams.location = `${location.lng},${location.lat}`;
    }
    
    onSearch(searchParams);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSearch}>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Control
                placeholder="Search services..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
              />
            </div>
            
            <div className="col-md-4">
              <Form.Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            
            <div className="col-md-2">
              <Button variant="primary" type="submit" className="w-100">
                Search
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ServiceSearch;
