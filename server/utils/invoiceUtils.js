import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoice = async (payment) => {
  try {
    const doc = new PDFDocument();
    const invoiceNumber = `INV-${payment.orderId.slice(-6)}`;
    const invoicePath = path.join('uploads', 'invoices', `${invoiceNumber}.pdf`);

    // Ensure directory exists
    // fs.mkdirSync(path.join('uploads', 'invoices'), { recursive: true });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(invoicePath));

    // Add content
    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);

    // Add invoice details
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Order ID: ${payment.orderId}`);
    doc.text(`Payment ID: ${payment.paymentId}`);
    doc.moveDown();

    // Add amount
    doc.text(`Amount Paid: ₹${(payment.amount / 100).toFixed(2)}`);
    doc.text(`Payment Status: ${payment.status.toUpperCase()}`);
    doc.moveDown();

    // Add footer
    doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

    // Finalize PDF
    doc.end();

    return {
      number: invoiceNumber,
      path: invoicePath,
      url: `/invoices/${invoiceNumber}.pdf`
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

/**
 * Generates invoice data from a booking
 * @param {Object} booking - The booking object with populated references
 * @returns {Object} Formatted invoice data
 */
export const createInvoiceData = (booking) => {
  if (!booking) {
    throw new Error('Booking is required to generate invoice');
  }
  
  return {
    invoiceNumber: `INV-${booking._id.toString().slice(-6)}`,
    dateIssued: new Date(),
    booking: {
      id: booking._id,
      service: booking.service.title,
      date: booking.scheduledDate,
      status: booking.status
    },
    client: {
      name: booking.client.name,
      email: booking.client.email,
      address: booking.client.address || 'N/A'
    },
    provider: {
      name: booking.provider.name,
      email: booking.provider.email,
      address: booking.provider.address || 'N/A'
    },
    amount: booking.totalAmount,
    paymentId: booking.payment.paymentId,
    paymentDate: booking.payment.paidAt
  };
};
