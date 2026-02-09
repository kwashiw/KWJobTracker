
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DevPreview from './DevPreview';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// In development: ?mode=app renders the app directly (used inside iframes)
// Otherwise, show the DevPreview wrapper
const params = new URLSearchParams(window.location.search);
const isAppMode = params.get('mode') === 'app';
const isDev = import.meta.env.DEV;

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isDev && !isAppMode ? <DevPreview /> : <App />}
  </React.StrictMode>
);
