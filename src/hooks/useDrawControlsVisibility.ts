
import { useCallback, useEffect } from 'react';

/**
 * Hook to ensure drawing controls remain visible and interactive
 */
export function useDrawControlsVisibility() {
  const ensureDrawControlsVisibility = useCallback(() => {
    try {
      // Make drawing controls visible
      const drawControls = document.querySelectorAll('.leaflet-draw.leaflet-control');
      drawControls.forEach(control => {
        (control as HTMLElement).style.display = 'block';
        (control as HTMLElement).style.visibility = 'visible';
        (control as HTMLElement).style.opacity = '1';
        (control as HTMLElement).style.zIndex = '12000';
        (control as HTMLElement).style.pointerEvents = 'auto';
      });
      
      // Ensure toolbar is visible
      const toolbars = document.querySelectorAll('.leaflet-draw-toolbar');
      toolbars.forEach(toolbar => {
        (toolbar as HTMLElement).style.display = 'block';
        (toolbar as HTMLElement).style.visibility = 'visible';
        (toolbar as HTMLElement).style.opacity = '1';
        (toolbar as HTMLElement).style.zIndex = '12000';
        (toolbar as HTMLElement).style.pointerEvents = 'auto';
      });
      
      // Ensure toolbar buttons are clickable
      const buttons = document.querySelectorAll('.leaflet-draw-toolbar a');
      buttons.forEach(button => {
        (button as HTMLElement).style.display = 'block';
        (button as HTMLElement).style.visibility = 'visible';
        (button as HTMLElement).style.opacity = '1';
        (button as HTMLElement).style.pointerEvents = 'auto';
        (button as HTMLElement).style.cursor = 'pointer';
      });
      
      // Fix control container z-index
      const controlContainer = document.querySelector('.leaflet-control-container');
      if (controlContainer) {
        (controlContainer as HTMLElement).style.zIndex = '10000';
      }
    } catch (err) {
      console.error('Error ensuring draw controls visibility:', err);
    }
  }, []);

  // Set up periodic check for control visibility
  useEffect(() => {
    const visibilityInterval = setInterval(() => {
      ensureDrawControlsVisibility();
    }, 500);
    
    return () => {
      clearInterval(visibilityInterval);
    };
  }, [ensureDrawControlsVisibility]);

  return { ensureDrawControlsVisibility };
}
