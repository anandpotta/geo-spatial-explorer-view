
import { useEffect } from 'react';

export function usePopupStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Ensure popup content receives all events */
      .marker-form-popup .leaflet-popup-content-wrapper,
      .marker-form-popup .leaflet-popup-content {
        pointer-events: auto !important;
      }
      
      /* Prevent click-through on the popup */
      .marker-form-popup .leaflet-popup-content-wrapper {
        cursor: default !important;
      }
      
      /* Ensure input field is top-most */
      .marker-form-popup input:focus {
        z-index: 9999 !important;
        position: relative;
      }
      
      /* Input should always be interactive */
      .marker-form-popup input {
        pointer-events: auto !important;
      }
      
      /* When marker form is active, disable map interactions */
      .marker-form-active .leaflet-control-container {
        pointer-events: none;
      }
      
      /* Fix for keyboard focus handling */
      .marker-form-popup form {
        isolation: isolate;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
