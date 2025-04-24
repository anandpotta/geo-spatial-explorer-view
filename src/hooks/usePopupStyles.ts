
import { useEffect } from 'react';

export function usePopupStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .marker-form-popup .leaflet-popup-content-wrapper,
      .marker-form-popup .leaflet-popup-content {
        pointer-events: auto !important;
      }
      .marker-form-popup .leaflet-popup-content-wrapper {
        cursor: default !important;
      }
      .marker-form-popup input:focus {
        z-index: 1000;
      }
      /* Disable map interactions when popup is open */
      .marker-form-active .leaflet-control-container {
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
