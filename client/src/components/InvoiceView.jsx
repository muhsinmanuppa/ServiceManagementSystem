import React from 'react';
import { Modal } from 'react-bootstrap';

const InvoiceView = ({ show, onHide, booking }) => {
  if (!booking) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Invoice Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="invoice p-3">
          <div className="d-flex justify-content-between mb-4">
            <div>
              <h4>Service Invoice</h4>
              <p className="mb-1">Booking ID: {booking._id}</p>
              <p className="mb-1">Date: {new Date(booking.scheduledDate).toLocaleDateString()}</p>
            </div>
            <div className="text-end">
              <h5>{booking.service?.title}</h5>
              <p className="mb-1">Provider: {booking.provider?.name}</p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <h6>Client Details</h6>
              <p className="mb-1">{booking.client?.name}</p>
              <p className="mb-1">{booking.client?.email}</p>
            </div>
            <div className="col-md-6 text-end">
              <h6>Quote Details</h6>
              <p className="mb-1">Amount: ₹{booking.quote?.price || booking.totalAmount}</p>
              <p className="mb-1">Hours: {booking.quote?.estimatedHours || 'N/A'}</p>
            </div>
          </div>

          {booking.quote?.notes && (
            <div className="mb-4">
              <h6>Service Notes</h6>
              <p>{booking.quote.notes}</p>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default InvoiceView;
