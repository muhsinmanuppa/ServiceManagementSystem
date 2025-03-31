import { useState } from 'react';
import { Form, Button, Table } from 'react-bootstrap';

const AvailabilityManager = ({ availability, onUpdate }) => {
  const [schedule, setSchedule] = useState(availability?.schedule || []);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots[slotIndex][field] = value;
    setSchedule(newSchedule);
    onUpdate(newSchedule);
  };

  const addSlot = (dayIndex) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].slots.push({ startTime: '09:00', endTime: '17:00', maxBookings: 1 });
    setSchedule(newSchedule);
    onUpdate(newSchedule);
  };

  return (
    <div className="availability-manager">
      <Table bordered>
        <thead>
          <tr>
            <th>Day</th>
            <th>Time Slots</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day, dayIndex) => (
            <tr key={day}>
              <td className="text-capitalize">{day}</td>
              <td>
                {schedule[dayIndex]?.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="d-flex gap-2 mb-2">
                    <Form.Control
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'startTime', e.target.value)}
                    />
                    <Form.Control
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'endTime', e.target.value)}
                    />
                    <Form.Control
                      type="number"
                      min="1"
                      value={slot.maxBookings}
                      onChange={(e) => handleSlotChange(dayIndex, slotIndex, 'maxBookings', e.target.value)}
                      style={{ width: '80px' }}
                    />
                  </div>
                ))}
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => addSlot(dayIndex)}
                >
                  Add Slot
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AvailabilityManager;
