
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startApiMock } from './lib/apiMock';

// Start the API mock before rendering the app.
// This allows the app to make 'fetch' calls to our mock API endpoints.
startApiMock();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);