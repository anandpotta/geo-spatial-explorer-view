
import { useEffect } from 'react';

export function usePopupStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Create a protective layer to prevent map interactions when form is open */
      .marker-form-active {
        position: relative;
      }
      
      .marker-form-active::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000; 
        pointer-events: none;
      }
      
      /* Ensure popup content receives all events */
      .marker-form-popup .leaflet-popup-content-wrapper,
      .marker-form-popup .leaflet-popup-content {
        pointer-events: auto !important;
        isolation: isolate;
        z-index: 1200 !important;
      }
      
      /* Prevent click-through on the popup */
      .marker-form-popup .leaflet-popup-content-wrapper {
        cursor: default !important;
        pointer-events: all !important;
      }
      
      /* Ensure input field is top-most */
      .marker-form-popup input {
        z-index: 9999 !important;
        position: relative;
        pointer-events: auto !important;
      }
      
      /* Input should always be interactive and visible during typing */
      .marker-form-popup input:focus {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        outline: none !important;
        pointer-events: all !important;
      }
      
      /* When marker form is active, disable map interactions */
      .marker-form-active .leaflet-control-container {
        pointer-events: none;
      }
      
      /* Fix for keyboard focus handling */
      .marker-form-popup form {
        isolation: isolate;
        z-index: 1100;
        pointer-events: all !important;
      }
      
      /* Ensure popup stays visible and doesn't close */
      .marker-form-popup.leaflet-popup {
        pointer-events: auto !important;
      }
      
      /* Ensure buttons are properly visible and interactive */
      .marker-form-popup button {
        pointer-events: auto !important;
        position: relative;
        z-index: 1200;
      }
      
      /* Make sure popup tip doesn't interfere with clicks */
      .marker-form-popup .leaflet-popup-tip-container {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
