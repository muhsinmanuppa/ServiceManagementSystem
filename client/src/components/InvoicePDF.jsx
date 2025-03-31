import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#3f51b5'
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid',
    marginBottom: 5,
    paddingBottom: 5
  },
  column: {
    flexDirection: 'column',
    marginBottom: 10
  },
  label: {
    width: '30%',
    fontWeight: 'bold'
  },
  value: {
    width: '70%'
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666'
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eee',
    marginVertical: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderBottomStyle: 'solid'
  },
  tableHeader: {
    backgroundColor: '#f9f9f9',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 5,
    fontSize: 10
  }
});

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// PDF Document Component
const InvoicePDF = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.header}>INVOICE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice Number:</Text>
          <Text style={styles.value}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date Issued:</Text>
          <Text style={styles.value}>{formatDate(invoice.dateIssued)}</Text>
        </View>
        
        <View style={{ marginTop: 20 }}>
          <Text style={styles.subheader}>From:</Text>
          <View style={styles.column}>
            <Text>{invoice.provider.name}</Text>
            <Text>{invoice.provider.email}</Text>
            <Text>{invoice.provider.address}</Text>
          </View>
        </View>
        
        <View style={{ marginTop: 15 }}>
          <Text style={styles.subheader}>To:</Text>
          <View style={styles.column}>
            <Text>{invoice.client.name}</Text>
            <Text>{invoice.client.email}</Text>
            <Text>{invoice.client.address}</Text>
          </View>
        </View>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '50%' }]}>Service</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>Date</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '50%' }]}>{invoice.booking.service}</Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>{formatDate(invoice.booking.date)}</Text>
            <Text style={[styles.tableCell, { width: '20%' }]}>₹{invoice.amount.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={[styles.row, { justifyContent: 'flex-end', marginTop: 20 }]}>
          <Text style={[styles.label, { textAlign: 'right' }]}>Total:</Text>
          <Text style={[styles.value, { textAlign: 'right', fontWeight: 'bold' }]}>₹{invoice.amount.toFixed(2)}</Text>
        </View>
        
        <View style={{ marginTop: 20 }}>
          <Text style={styles.subheader}>Payment Information:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>Paid</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment ID:</Text>
            <Text style={styles.value}>{invoice.paymentId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.paymentDate)}</Text>
          </View>
        </View>
        
        <Text style={styles.footer}>Thank you for your business!</Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
