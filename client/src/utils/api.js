import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

const publicPaths = [
  'auth/login',
  'auth/register',
  'auth/send-otp',
  'auth/resend-otp',
  'auth/verify-otp'
];

// Update profile
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

// Update request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // profile routing
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

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (originalRequest._retry || originalRequest.url?.includes('auth/')) {
      return Promise.reject(error);
    }

    if (!error.response && !originalRequest._retry) {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          console.log(`Retry attempt ${retries + 1}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return await api(originalRequest);
        } catch (retryError) {
          retries++;
          if (retries === MAX_RETRIES) {
            break;
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

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

export { api as default };
