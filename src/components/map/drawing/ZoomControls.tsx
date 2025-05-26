
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface ZoomControlsProps {
  map: L.Map | null;
  isControlsAdded: boolean;
  onControlsAdded: () => void;
}

export const ZoomControls = ({ map, isControlsAdded, onControlsAdded }: ZoomControlsProps) => {
  const zoomControlsAddedRef = useRef<boolean>(false);

  useEffect(() => {
    // Ensure Leaflet Draw CSS is properly loaded
    const ensureDrawCSS = () => {
      // Check if leaflet-draw CSS is loaded
      const existingDrawCSS = document.querySelector('link[href*="leaflet.draw"]');
      if (!existingDrawCSS) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
        document.head.appendChild(link);
      }

      // Add custom styles for better icon visibility
      const customStyles = document.createElement('style');
      customStyles.textContent = `
        /* Ensure Leaflet Draw icons are visible */
        .leaflet-draw-toolbar a {
          background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/images/spritesheet.png') !important;
          background-repeat: no-repeat !important;
        }
        
        .leaflet-draw-draw-polyline {
          background-position: -2px -2px !important;
        }
        
        .leaflet-draw-draw-polygon {
          background-position: -31px -2px !important;
        }
        
        .leaflet-draw-draw-rectangle {
          background-position: -62px -2px !important;
        }
        
        .leaflet-draw-draw-circle {
          background-position: -92px -2px !important;
        }
        
        .leaflet-draw-draw-marker {
          background-position: -122px -2px !important;
        }
        
        .leaflet-draw-edit-edit {
          background-position: -152px -2px !important;
        }
        
        .leaflet-draw-edit-remove {
          background-position: -182px -2px !important;
        }
        
        /* Custom zoom controls styling */
        .custom-zoom-controls {
          display: flex !important;
          gap: 2px !important;
          margin-left: 10px !important;
        }
        
        .custom-zoom-btn {
          width: 26px !important;
          height: 26px !important;
          line-height: 24px !important;
          display: inline-block !important;
          text-align: center !important;
          text-decoration: none !important;
          background: #fff !important;
          border: 2px solid rgba(0,0,0,0.2) !important;
          border-radius: 4px !important;
          color: #333 !important;
          font-weight: bold !important;
          font-size: 16px !important;
          cursor: pointer !important;
          box-shadow: 0 1px 5px rgba(0,0,0,0.65) !important;
        }
        
        .custom-zoom-btn:hover {
          background: #f4f4f4 !important;
          color: #333 !important;
          text-decoration: none !important;
        }
      `;
      
      // Remove existing custom styles to avoid duplicates
      const existingStyles = document.querySelector('#zoom-controls-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
      
      customStyles.id = 'zoom-controls-styles';
      document.head.appendChild(customStyles);
    };

    ensureDrawCSS();
  }, []);

  // Function to add zoom controls to the draw toolbar
  const addZoomControlsToToolbar = () => {
    if (!map || zoomControlsAddedRef.current || isControlsAdded) return;
    
    console.log('Attempting to add zoom controls to toolbar');
    
    // Wait for the draw toolbar to be available
    const checkAndAddControls = () => {
      // Look for the draw control container
      const drawControl = document.querySelector('.leaflet-draw') as HTMLElement;
      
      if (drawControl && !zoomControlsAddedRef.current) {
        console.log('Found draw control, adding zoom controls');
        
        // Remove existing zoom controls if they exist
        const existingZoomControls = document.querySelector('.custom-zoom-controls');
        if (existingZoomControls) {
          existingZoomControls.remove();
        }
        
        // Create container for zoom controls
        const zoomContainer = document.createElement('div');
        zoomContainer.className = 'custom-zoom-controls leaflet-bar';
        zoomContainer.style.cssText = `
          position: absolute;
          top: 0;
          right: -120px;
          display: flex;
          gap: 2px;
          z-index: 1000;
        `;
        
        // Create zoom in button
        const zoomInBtn = document.createElement('a');
        zoomInBtn.className = 'custom-zoom-btn';
        zoomInBtn.href = '#';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomIn();
          toast.success('Zoomed in');
        };
        
        // Create zoom out button
        const zoomOutBtn = document.createElement('a');
        zoomOutBtn.className = 'custom-zoom-btn';
        zoomOutBtn.href = '#';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.innerHTML = '−';
        zoomOutBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomOut();
          toast.success('Zoomed out');
        };
        
        // Create reset view button
        const resetBtn = document.createElement('a');
        resetBtn.className = 'custom-zoom-btn';
        resetBtn.href = '#';
        resetBtn.title = 'Reset View';
        resetBtn.innerHTML = '⌂';
        resetBtn.onclick = (e) => {
          e.preventDefault();
          map.setView([51.505, -0.09], 13);
          toast.info('View reset');
        };
        
        // Add buttons to container
        zoomContainer.appendChild(zoomInBtn);
        zoomContainer.appendChild(zoomOutBtn);
        zoomContainer.appendChild(resetBtn);
        
        // Add container to draw control
        drawControl.style.position = 'relative';
        drawControl.appendChild(zoomContainer);
        
        zoomControlsAddedRef.current = true;
        onControlsAdded();
        console.log('Zoom controls added successfully');
      } else {
        // Retry after a short delay if control not found
        setTimeout(checkAndAddControls, 500);
      }
    };
    
    // Start checking for control
    setTimeout(checkAndAddControls, 100);
  };

  useEffect(() => {
    if (map && !isControlsAdded) {
      setTimeout(addZoomControlsToToolbar, 1000);
    }
  }, [map, isControlsAdded]);

  return null; // This component doesn't render anything
};
