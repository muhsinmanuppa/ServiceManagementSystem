import { Card, Row, Col } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const ProviderStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/providers/stats');
        if (response.data.success) {
          setStats(response.data.stats);
        } else {
          throw new Error(response.data.message || 'Failed to fetch stats');
        }
      } catch (error) {
        console.error('Error fetching provider stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Row className="g-4 mb-4">
      <Col md={3}>
        <Card className="text-center h-100">
          <Card.Body>
            <h3 className="mb-0">{stats?.total || 0}</h3>
            <Card.Text>Total Providers</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 border-success">
          <Card.Body>
            <h3 className="mb-0 text-success">{stats?.verified || 0}</h3>
            <Card.Text>Verified Providers</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 border-warning">
          <Card.Body>
            <h3 className="mb-0 text-warning">{stats?.pending || 0}</h3>
            <Card.Text>Pending Verifications</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center h-100 border-danger">
          <Card.Body>
            <h3 className="mb-0 text-danger">{stats?.suspended || 0}</h3>
            <Card.Text>Suspended Providers</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ProviderStats;
