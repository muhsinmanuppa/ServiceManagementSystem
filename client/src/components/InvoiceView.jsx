import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const InvoiceView = ({ show, onHide, booking }) => {
  if (!booking) return null;

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : '';

  return (
    <>
      {/* Print CSS */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-invoice, #print-invoice * {
              visibility: visible;
            }
            #print-invoice {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>

      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Invoice Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Invoice Area */}
          <div id="print-invoice" className="invoice p-4 border rounded bg-white">

            {/* Header */}
            <div className="d-flex justify-content-between mb-4">
              <div>
                <h4 className="fw-bold">Service Invoice</h4>
                <p className="mb-1"><b>Booking ID:</b> {booking._id}</p>
                <p className="mb-1"><b>Date:</b> {formatDate(booking.scheduledDate)}</p>
                <p className="mb-1"><b>Status:</b> {booking.status}</p>
              </div>

              <div className="text-end">
                <h5 className="fw-bold">{booking.service?.title || 'Service'}</h5>
                <p className="mb-1"><b>Provider:</b> {booking.provider?.name || '-'}</p>
                <p className="mb-1">{booking.provider?.email || ''}</p>
              </div>
            </div>

            <hr />

            {/* Client + Quote */}
            <div className="row mb-4">
              <div className="col-md-6">
                <h6 className="fw-bold">Client Details</h6>
                <p className="mb-1">{booking.client?.name || '-'}</p>
                <p className="mb-1">{booking.client?.email || '-'}</p>
              </div>

              <div className="col-md-6 text-end">
                <h6 className="fw-bold">Quote Details</h6>
                <p className="mb-1">
                  Amount: ₹{booking.quote?.price ?? booking.totalAmount}
                </p>
                <p className="mb-1">
                  Estimated Hours: {booking.quote?.estimatedHours ?? 'N/A'}
                </p>
                <p className="mb-1">
                  Payment Status: {booking.payment?.status || 'pending'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {booking.quote?.notes && (
              <div className="mb-4">
                <h6 className="fw-bold">Service Notes</h6>
                <p>{booking.quote.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <small className="text-muted">
                Thank you for choosing our service.
              </small>

              <Button variant="primary" onClick={() => window.print()}>
                Print Invoice
              </Button>
            </div>

          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default InvoiceView;
