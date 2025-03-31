import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, InputGroup, Button, Card, Collapse } from 'react-bootstrap';

const ServiceSearch = ({ onSearch, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    distance: '10',
    ...initialFilters
  });

  const [location, setLocation] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    // Get user's location if they allow it
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
                <option value="cleaning">Cleaning</option>
                <option value="repair">Repair</option>
                <option value="plumbing">Plumbing</option>
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
