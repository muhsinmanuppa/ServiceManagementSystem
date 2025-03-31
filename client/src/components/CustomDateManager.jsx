import { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const CustomDateManager = ({ customDates = [], onUpdate }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [reason, setReason] = useState('');

  const handleAddDate = () => {
    if (!selectedDate) return;

    const newDate = {
      date: selectedDate,
      isHoliday,
      reason: reason.trim(),
      slots: isHoliday ? [] : [{ startTime: '09:00', endTime: '17:00', maxBookings: 1 }]
    };

    onUpdate([...customDates, newDate]);
    resetForm();
  };

  const resetForm = () => {
    setSelectedDate(null);
    setIsHoliday(false);
    setReason('');
  };

  const removeCustomDate = (index) => {
    const updatedDates = customDates.filter((_, i) => i !== index);
    onUpdate(updatedDates);
  };

  return (
    <div className="custom-date-manager">
      <Card className="mb-3">
        <Card.Body>
          <h6>Add Custom Date or Holiday</h6>
          <Form.Group className="mb-3">
            <Form.Label>Select Date</Form.Label>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              className="form-control"
              minDate={new Date()}
              placeholderText="Choose a date"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Mark as Holiday/Unavailable"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason/Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason for custom date or holiday"
            />
          </Form.Group>

          <Button 
            variant="primary" 
            onClick={handleAddDate}
            disabled={!selectedDate}
          >
            Add Date
          </Button>
        </Card.Body>
      </Card>

      {customDates.length > 0 && (
        <div className="custom-dates-list">
          <h6>Custom Dates and Holidays</h6>
          {customDates.map((date, index) => (
            <Card key={index} className="mb-2">
              <Card.Body className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{new Date(date.date).toLocaleDateString()}</strong>
                  <br />
                  <span className={`badge ${date.isHoliday ? 'bg-danger' : 'bg-info'}`}>
                    {date.isHoliday ? 'Holiday' : 'Custom Schedule'}
                  </span>
                  {date.reason && <p className="mb-0 small text-muted">{date.reason}</p>}
                </div>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => removeCustomDate(index)}
                >
                  Remove
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDateManager;
