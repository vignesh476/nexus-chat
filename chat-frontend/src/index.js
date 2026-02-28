import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Global error logging (basic)
window.addEventListener('error', (e) => {
  console.error('[GlobalError]', e.message, e.filename, e.lineno, e.colno);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[UnhandledPromiseRejection]', e.reason);
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
