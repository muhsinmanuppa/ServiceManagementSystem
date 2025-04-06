import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // Add fallback
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Remove test/ping from public paths
const publicPaths = [
  'auth/login',
  'auth/register',
  'auth/send-otp',
  'auth/resend-otp',
  'auth/verify-otp'
];

// Update profile endpoint logic
const getProfileEndpoint = (userRole, path) => {
  if (path.includes('/profile')) {
    switch (userRole) {
      case 'provider':
        return '/profiles/provider';
      case 'client':
        return '/users/profile';
      default:
        return path;
    }
  }
  return path;
};

// Update request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Handle profile endpoint routing
    if (config.url.includes('/profile')) {
      config.url = getProfileEndpoint(user.role, config.url);
    }

    if (!publicPaths.some(path => config.url?.includes(path))) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Add request interceptor logging
api.interceptors.request.use(
  config => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers
    });
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor with retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Debug unauthorized errors
    if (error.response?.status === 401) {
      console.log('Auth Error Details:', {
        url: originalRequest?.url,
        hasToken: !!localStorage.getItem('token'),
        headers: originalRequest?.headers
      });
    }

    // Handle unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('auth/')) {
      originalRequest._retry = true;
      console.log('Unauthorized error. Token might be expired.');
      
      // For now, just notify user about session expiry
      if (!originalRequest._suppressErrorNotification) {
        window.dispatchEvent(new CustomEvent('api-error', { 
          detail: {
            message: 'Your session has expired. Please sign in again.',
            type: 'error',
            duration: 0
          }
        }));
        
        // Optional: Redirect to login after short delay
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login?expired=true';
        }, 1500);
      }
      
      return Promise.reject(error);
    }

    // Don't retry if we've already retried or specific status codes
    if (originalRequest._retry || 
        (error.response && [401, 403, 404].includes(error.response.status))) {
      return Promise.reject(error);
    }

    if (!error.response) {
      // Handle network errors with retry
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          console.log(`Retry attempt ${retries + 1} of ${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)));
          originalRequest._retry = true;
          return await api(originalRequest);
        } catch (retryError) {
          retries++;
          if (retries === MAX_RETRIES) {
            // Dispatch global error notification
            window.dispatchEvent(new CustomEvent('api-error', {
              detail: {
                message: 'Unable to connect to server. Please check your connection.',
                type: 'error',
                duration: 0
              }
            }));
            throw error;
          }
        }
      }
    }

    // Server returned an error response
    const errorDetails = {
      url: error.config?.url || 'unknown endpoint',
      method: error.config?.method?.toUpperCase() || 'unknown method',
      status: error.response?.status || 'Unknown Error',
      message: error.response?.data?.message || error.message
    };
    
    console.error('API Error:', errorDetails.status, errorDetails.message, errorDetails.url);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Don't redirect for auth-related paths
      const isAuthPath = publicPaths.some(path => error.config?.url?.includes(path));
      
      if (!isAuthPath && !window.location.pathname.includes('/login')) {
        console.log('Session expired. Redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Add dispatch to notification store before redirecting
        window.dispatchEvent(new CustomEvent('api-error', { 
          detail: {
            message: 'Your session has expired. Please sign in again.',
            type: 'error',
            duration: 0
          }
        }));
        
        setTimeout(() => {
          window.location.href = '/login?expired=true';
        }, 1000);
      }
    }
    
    // Notify about errors
    if (!error.config?._suppressErrorNotification) {
      const event = new CustomEvent('api-error', { 
        detail: {
          message: errorDetails.message || 'An unexpected error occurred',
          type: 'error',
          duration: 6000
        }
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

// Add response interceptor logging
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Add interceptor to log payment-related requests
api.interceptors.request.use(
  config => {
    if (config.url?.includes('/payments/')) {
      console.log('Payment request:', {
        url: config.url,
        method: config.method,
        data: config.data
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add payment endpoint debug logging
api.interceptors.request.use(
  config => {
    if (config.url?.includes('/payments/')) {
      console.log('Payment Request:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers
      });
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    if (response.config.url?.includes('/payments/')) {
      console.log('Payment Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  error => {
    if (error.config?.url?.includes('/payments/')) {
      console.error('Payment Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
    }
    return Promise.reject(error);
  }
);

// Export the api instance
export { api as default };
