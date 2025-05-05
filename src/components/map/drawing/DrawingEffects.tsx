
import { useEffect } from 'react';
import '../../../../src/styles/drawing-paths.css';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
}

const DrawingEffects = ({ activeTool, isInitialized }: DrawingEffectsProps) => {
  // Add CSS to ensure SVG paths are visible
  useEffect(() => {
    if (!isInitialized) return;
    
    // Add dynamic stylesheet to make paths visible
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-overlay-pane path.leaflet-interactive {
        stroke-width: 4px !important;
        stroke-opacity: 1 !important;
        fill-opacity: 0.3 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
    
    // Function to periodically check and fix path visibility
    const makePathsVisible = () => {
      const paths = document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive');
      paths.forEach(path => {
        if (!path.classList.contains('visible-path-stroke')) {
          path.classList.add('visible-path-stroke');
        }
      });
    };
    
    // Run initially
    makePathsVisible();
    
    // Set up interval to check paths
    const intervalId = setInterval(makePathsVisible, 1000);
    
    return () => {
      clearInterval(intervalId);
      document.head.removeChild(style);
    };
  }, [isInitialized]);

  return null;
};

export default DrawingEffects;
