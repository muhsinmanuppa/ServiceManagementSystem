/**
 * Format a number as INR currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include the ₹ symbol
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a date string
 * @param {string} dateString - The date string to format
 * @param {boolean} includeTime - Whether to include the time in the format
 * @returns {string} - The formatted date string
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return new Intl.DateTimeFormat('en-IN', options).format(date);
};
