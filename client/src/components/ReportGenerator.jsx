import { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';

const ReportGenerator = ({ onDataReceived }) => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [type, setType] = useState('bookings');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
          onDataReceived({});
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="bookings">Bookings Report</option>
                  <option value="revenue">Revenue Report</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                />
              </Form.Group>
            </div>

            <div className="col-md-3">
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                />
              </Form.Group>
            </div>

            <div className="col-md-2">
              <Form.Label>&nbsp;</Form.Label>
              <Button 
                type="submit" 
                className="w-100"
                disabled={loading || !dateRange.startDate || !dateRange.endDate}
              >
                {loading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ReportGenerator;
