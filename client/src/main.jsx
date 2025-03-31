import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';  // Import using named export
import App from './App';

// Import Bootstrap CSS - this is critical for bootstrap styling
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap JS for interactive components
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import './index.css';
import { setupApiErrorHandler } from './utils/notificationUtils';

// Set up global error handler after store is initialized
setupApiErrorHandler(store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
