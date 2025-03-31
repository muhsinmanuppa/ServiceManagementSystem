import React from 'react';
import { Card } from 'react-bootstrap';
import { formatCurrency } from '../utils/formatters';

const PaymentSummary = ({ booking }) => {
  if (!booking) return null;
  
  const {
    baseAmount = 0,
    taxAmount = 0,
    discountAmount = 0,
    totalAmount = 0,
    paymentStatus
  } = booking;

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'failed':
        return 'bg-danger';
      case 'refunded':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Payment Summary</h5>
        <span className={`badge ${getStatusBadgeClass(paymentStatus)}`}>
          {paymentStatus || 'Not Paid'}
        </span>
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between mb-2">
          <span>Base Amount:</span>
          <span>{formatCurrency(baseAmount)}</span>
        </div>
        
        {taxAmount > 0 && (
          <div className="d-flex justify-content-between mb-2">
            <span>Tax:</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        
        {discountAmount > 0 && (
          <div className="d-flex justify-content-between mb-2">
            <span>Discount:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        
        <hr />
        
        <div className="d-flex justify-content-between">
          <strong>Total Amount:</strong>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
        
        {booking.paymentId && (
          <div className="mt-3 pt-2 border-top">
            <small className="text-muted d-block">Payment ID: {booking.paymentId}</small>
            {booking.paymentDate && (
              <small className="text-muted d-block">
                Payment Date: {new Date(booking.paymentDate).toLocaleDateString()}
              </small>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PaymentSummary;
