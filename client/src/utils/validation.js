export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};


export const validateService = (data) => {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!data.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!data.price || isNaN(data.price) || Number(data.price) <= 0) {
    errors.price = 'Price must be a positive number';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};


export const validateRegistration = (formData) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required';
  } else if (formData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!formData.password || formData.password.trim() === '') {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }
  
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  if (!formData.role) {
    errors.role = 'Please select a role';
  }
  
  return errors;
};


export const validateBooking = (formData) => {
  const errors = {};
  
  if (!formData.scheduledDate) {
    errors.scheduledDate = 'Please select a date and time';
  } else {
    const selectedDate = new Date(formData.scheduledDate);
    const now = new Date();
    
    if (selectedDate <= now) {
      errors.scheduledDate = 'Selected date must be in the future';
    }
  }
  
  if (!formData.duration || formData.duration <= 0) {
    errors.duration = 'Please select a valid duration';
  }
  
  return errors;
};


export const validateProfile = (formData) => {
  const errors = {};
  const phoneRegex = /^[0-9+\- ]{8,15}$/;
  
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (formData.phone && !phoneRegex.test(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  return errors;
};


export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      feedback: 'Password is required',
      isStrong: false
    };
  }
  
  let score = 0;
  const suggestions = [];
  
  // Length
  if (password.length < 8) {
    suggestions.push('Make your password at least 8 characters long');
  } else {
    score += password.length > 12 ? 2 : 1;
  }
  
  // Complexity
  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Add an uppercase letter');
  
  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Add a lowercase letter');
  
  if (/[0-9]/.test(password)) score += 1;
  else suggestions.push('Add a number');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push('Add a special character');
  
  let feedback = '';
  let isStrong = false;
  
  if (score < 3) {
    feedback = 'Weak password';
    isStrong = false;
  } else if (score < 5) {
    feedback = 'Moderate password';
    isStrong = password.length >= 8;
  } else {
    feedback = 'Strong password';
    isStrong = true;
  }
  
  return {
    score,
    feedback,
    isStrong,
    suggestions
  };
};
