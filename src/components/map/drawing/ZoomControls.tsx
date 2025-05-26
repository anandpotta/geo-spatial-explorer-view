
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface ZoomControlsProps {
  map: L.Map | null;
  isControlsAdded: boolean;
  onControlsAdded: () => void;
}

export const ZoomControls = ({ map, isControlsAdded, onControlsAdded }: ZoomControlsProps) => {
  const zoomControlsAddedRef = useRef<boolean>(false);

  // Function to add zoom controls to the draw toolbar
  const addZoomControlsToToolbar = () => {
    if (!map || zoomControlsAddedRef.current || isControlsAdded) return;
    
    // Wait for the draw toolbar to be available
    const checkAndAddControls = () => {
      // Look for the leaflet draw toolbar specifically
      const drawToolbar = document.querySelector('.leaflet-draw-toolbar');
      
      if (drawToolbar && !zoomControlsAddedRef.current) {
        console.log('Found draw toolbar, adding zoom controls');
        
        // Remove existing zoom controls if they exist
        const existingZoomControls = document.querySelector('.custom-zoom-controls');
        if (existingZoomControls) {
          existingZoomControls.remove();
        }
        
        // Create zoom in button
        const zoomInBtn = document.createElement('a');
        zoomInBtn.className = 'leaflet-draw-toolbar-button leaflet-toolbar-button';
        zoomInBtn.href = '#';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.style.cssText = `
          width: 26px;
          height: 26px;
          line-height: 26px;
          display: block;
          text-align: center;
          text-decoration: none;
          background: #fff;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          color: black;
          font-weight: bold;
          font-size: 18px;
          cursor: pointer;
          margin-right: 0;
          margin-left: 0;
          float: left;
        `;
        zoomInBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomIn();
          toast.success('Zoomed in');
        };
        
        // Create zoom out button
        const zoomOutBtn = document.createElement('a');
        zoomOutBtn.className = 'leaflet-draw-toolbar-button leaflet-toolbar-button';
        zoomOutBtn.href = '#';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.innerHTML = '−';
        zoomOutBtn.style.cssText = `
          width: 26px;
          height: 26px;
          line-height: 26px;
          display: block;
          text-align: center;
          text-decoration: none;
          background: #fff;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          color: black;
          font-weight: bold;
          font-size: 18px;
          cursor: pointer;
          margin-right: 0;
          margin-left: 0;
          float: left;
        `;
        zoomOutBtn.onclick = (e) => {
          e.preventDefault();
          map.zoomOut();
          toast.success('Zoomed out');
        };
        
        // Create reset view button
        const resetBtn = document.createElement('a');
        resetBtn.className = 'leaflet-draw-toolbar-button leaflet-toolbar-button';
        resetBtn.href = '#';
        resetBtn.title = 'Reset View';
        resetBtn.innerHTML = '⌂';
        resetBtn.style.cssText = `
          width: 26px;
          height: 26px;
          line-height: 26px;
          display: block;
          text-align: center;
          text-decoration: none;
          background: #fff;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          color: black;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          margin-right: 0;
          margin-left: 0;
          float: left;
        `;
        resetBtn.onclick = (e) => {
          e.preventDefault();
          map.setView([51.505, -0.09], 13);
          toast.info('View reset');
        };
        
        // Add buttons directly to the toolbar
        drawToolbar.appendChild(zoomInBtn);
        drawToolbar.appendChild(zoomOutBtn);
        drawToolbar.appendChild(resetBtn);
        
        zoomControlsAddedRef.current = true;
        onControlsAdded();
        console.log('Zoom controls added successfully to draw toolbar');
      } else {
        // Retry after a short delay if toolbar not found
        setTimeout(checkAndAddControls, 300);
      }
    };
    
    // Start checking for toolbar
    setTimeout(checkAndAddControls, 100);
  };

  useEffect(() => {
    if (map && !isControlsAdded) {
      setTimeout(addZoomControlsToToolbar, 500);
    }
  }, [map, isControlsAdded]);

  return null; // This component doesn't render anything
};
