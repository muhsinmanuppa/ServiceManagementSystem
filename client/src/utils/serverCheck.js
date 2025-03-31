/**
 * Utility for checking API server connectivity
 */
import api, { checkServerConnection } from './api';

const checkServerConnectivity = async () => {
  try {
    // Try to make a simple request to check if server is up
    const response = await api.get('/test/ping', { 
      timeout: 3000,
      // Don't show error notification for this diagnostic request
      _suppressErrorNotification: true
    });
    
    return {
      connected: true,
      details: response.data,
      message: 'Connected to API server'
    };
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    
    if (!error.response) {
      return {
        connected: false,
        error,
        message: 'Cannot connect to API server. The server may be down or misconfigured.',
        suggestions: [
          'Ensure the API server is running at ' + api.defaults.baseURL,
          'Check that the correct API URL is set in your .env file',
          'Check your network connection',
          'Verify there are no CORS issues'
        ]
      };
    }
    
    return {
      connected: false,
      status: error.response?.status,
      error,
      message: `Connected to server but received error: ${error.response?.status} ${error.response?.statusText || ''}`
    };
  }
};

const displayServerStatus = () => {
  const statusDiv = document.createElement('div');
  statusDiv.style.position = 'fixed';
  statusDiv.style.bottom = '10px';
  statusDiv.style.right = '10px';
  statusDiv.style.padding = '10px';
  statusDiv.style.background = 'rgba(0,0,0,0.7)';
  statusDiv.style.color = 'white';
  statusDiv.style.borderRadius = '4px';
  statusDiv.style.fontSize = '12px';
  statusDiv.style.zIndex = '9999';
  
  statusDiv.textContent = 'Checking API server...';
  document.body.appendChild(statusDiv);
  
  checkServerConnectivity().then(status => {
    if (status.connected) {
      statusDiv.style.background = 'rgba(0,128,0,0.7)';
      statusDiv.textContent = '✓ API Server Connected';
    } else {
      statusDiv.style.background = 'rgba(255,0,0,0.7)';
      statusDiv.textContent = '✗ API Server Disconnected';
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
      statusDiv.style.opacity = '0';
      statusDiv.style.transition = 'opacity 0.5s';
      setTimeout(() => statusDiv.remove(), 500);
    }, 5000);
  });
};

// Only in development mode, check server status on page load
// Safe environment check that avoids direct process reference
if (typeof window !== 'undefined') {
  // Check for development mode using import.meta when available
  const isDevelopment = 
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE !== 'production') || 
    (window.__DEVELOPMENT__ === true);  // Fallback to a global flag that your build system might set
    
  if (isDevelopment) {
    window.addEventListener('load', () => {
      setTimeout(displayServerStatus, 1000);
      
      // Make the utility available in console for debugging
      window.checkServerConnectivity = checkServerConnectivity;
    });
  }
}

let connectionStatus = false;
let checkInterval = null;

const startServerCheck = () => {
  if (checkInterval) return;

  const check = async () => {
    try {
      await checkServerConnection();
      if (!connectionStatus) {
        connectionStatus = true;
        window.dispatchEvent(new CustomEvent('server-connected'));
      }
    } catch (error) {
      if (connectionStatus) {
        connectionStatus = false;
        window.dispatchEvent(new CustomEvent('server-disconnected'));
      }
    }
  };

  // Initial check
  check();
  
  // Set up interval for subsequent checks
  checkInterval = setInterval(check, 30000); // Check every 30 seconds
};

const stopServerCheck = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Single export statement for all functions
export {
  checkServerConnectivity,
  displayServerStatus,
  startServerCheck,
  stopServerCheck
};