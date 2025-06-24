
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Development server restart trigger
console.log('Development server starting...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
