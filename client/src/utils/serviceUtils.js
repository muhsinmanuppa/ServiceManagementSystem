/**
 * Format price with Indian Rupee symbol
 * @param {number} price - The price to format
 * @param {boolean} showSymbol - Whether to include the ₹ symbol
 * @returns {string} - Formatted price
 */
export const formatPrice = (price, showSymbol = true) => {
  if (price === undefined || price === null) {
    return showSymbol ? '₹0' : '0';
  }

  // Convert to number if it's a string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle NaN
  if (isNaN(numericPrice)) {
    return showSymbol ? '₹0' : '0';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return formatter.format(numericPrice);
};

export const filterServices = (services, filters) => {
  return services.filter(service => {
    const matchesSearch = !filters.search || 
      service.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      service.description.toLowerCase().includes(filters.search.toLowerCase());
      
    const matchesPrice = (!filters.minPrice || service.price >= filters.minPrice) &&
      (!filters.maxPrice || service.price <= filters.maxPrice);

    return matchesSearch && matchesPrice;
  });
};

/**
 * Generate star rating display
 * @param {number} rating - Rating value (0-5)
 * @returns {string} - HTML string with star icons
 */
export const generateStarRating = (rating) => {
  if (!rating) rating = 0;
  
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let stars = '';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill text-warning"></i>';
  }
  
  // Add half star if needed
  if (halfStar) {
    stars += '<i class="bi bi-star-half text-warning"></i>';
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star text-warning"></i>';
  }
  
  return stars;
};

/**
 * Calculate time since a given date
 * @param {string|Date} date - Date to calculate from
 * @returns {string} - Human readable time difference
 */
export const timeSince = (date) => {
  const now = new Date();
  const pastDate = new Date(date);
  const seconds = Math.floor((now - pastDate) / 1000);
  
  let interval = Math.floor(seconds / 31536000); // years
  
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000); // months
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400); // days
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return 'Just now';
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'datetime')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'datetime':
      return dateObj.toLocaleString();
    default:
      return dateObj.toLocaleDateString();
  }
};
