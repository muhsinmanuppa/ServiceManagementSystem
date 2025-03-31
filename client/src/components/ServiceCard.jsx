import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from 'react-bootstrap';

const ServiceCard = ({ service }) => {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Img 
        variant="top" 
        src={service.images && service.images.length ? service.images[0] : '/placeholder-service.jpg'} 
        style={{ height: '160px', objectFit: 'cover' }}
      />
      <Card.Body>
        <Card.Title as="h5">{service.title}</Card.Title>
        
        <div className="mb-2">
          <Badge bg="primary" className="me-1">{service.category?.name}</Badge>
          {service.featured && <Badge bg="warning" text="dark">Featured</Badge>}
        </div>
        
        <Card.Text as="div" className="text-truncate-3 mb-2" style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: '3',
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.5em',
          maxHeight: '4.5em'
        }}>
          {service.description}
        </Card.Text>
        
        <div className="d-flex align-items-center justify-content-between mt-auto">
          <span className="fw-bold">₹{service.price.toFixed(2)}</span>
          <Link to={`/services/${service._id}`} className="btn btn-sm btn-primary">View Details</Link>
        </div>
      </Card.Body>
      <Card.Footer className="text-muted small">
        By: {service.provider?.name}
      </Card.Footer>
    </Card>
  );
};

export default ServiceCard;
