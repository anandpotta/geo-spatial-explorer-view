
import L from 'leaflet';

/**
 * Applies patches to ensure paths and markers are visible in Leaflet
 */
export function applyVisibilityPatches(): () => void {
  // Apply patch for the "type is not defined" error in Leaflet Draw
  // Force Leaflet to use SVG renderer by default for all vector layers
  const originalFactory = L.SVG;
  L.SVG = function(options?: any) {
    // Use 'new' with the original factory
    const renderer = new originalFactory(options) as any; // Use type assertion to access internal properties
    if (renderer._initContainer) {
      const originalInitContainer = renderer._initContainer;
      renderer._initContainer = function() {
        originalInitContainer.call(this);
        if (this._container) {
          // Set attributes that might help with visibility
          this._container.setAttribute('style', 'pointer-events: auto;');
          this._container.style.visibility = 'visible';
          this._container.style.opacity = '1';
        }
      };
    }
    return renderer;
  } as any;
  
  // Initialize stylesheet to ensure drawing elements are visible
  const ensureStylesLoaded = () => {
    // Check if styles already exist
    if (document.getElementById('leaflet-draw-visibility-styles')) return;

    // Create a style element to ensure all Leaflet Draw markers are visible
    const styleElement = document.createElement('style');
    styleElement.id = 'leaflet-draw-visibility-styles';
    styleElement.textContent = `
      .leaflet-marker-icon,
      .leaflet-marker-shadow,
      .leaflet-draw-tooltip,
      .leaflet-div-icon {
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      .leaflet-marker-icon {
        z-index: 10000 !important;
      }
      .leaflet-draw-guide-dash {
        visibility: visible !important;
        opacity: 1 !important;
      }
      .leaflet-editing-icon {
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 10000 !important;
        pointer-events: auto !important;
      }
      svg.leaflet-zoom-animated > g > path {
        pointer-events: auto;
      }
      .leaflet-interactive {
        pointer-events: auto !important;
      }
      .leaflet-pane svg path {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(styleElement);
  };

  ensureStylesLoaded();

  // Create a MutationObserver to ensure marker visibility on DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Look for marker elements that might have been added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.classList.contains('leaflet-marker-icon') || 
                element.classList.contains('leaflet-editing-icon')) {
              element.setAttribute('style', 'visibility: visible !important; opacity: 1 !important; z-index: 10000 !important; pointer-events: auto !important;');
            }
            if (element.classList.contains('leaflet-marker-shadow')) {
              element.setAttribute('style', 'visibility: visible !important; opacity: 1 !important; z-index: 9999 !important;');
            }
            
            // Check for SVG paths within added elements
            const paths = element.querySelectorAll('path');
            paths.forEach(path => {
              path.setAttribute('style', 'pointer-events: auto !important;');
            });
          }
        });
      }
    });
  });

  // Start observing with a specific configuration
  observer.observe(document.body, { childList: true, subtree: true });

  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}
