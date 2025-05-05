
import { useEffect, useCallback } from 'react';

interface DrawControlInteractionProps {
  isMountedRef: React.MutableRefObject<boolean>;
  ensureDrawControlsVisibility: () => void;
}

/**
 * Hook to handle interactions with drawing controls
 */
export function useDrawControlInteractions({
  isMountedRef,
  ensureDrawControlsVisibility
}: DrawControlInteractionProps) {
  // Function to attach event listeners to draw controls
  const addDrawControlListeners = useCallback(() => {
    const handleDrawControlInteraction = (e: MouseEvent) => {
      // Prevent any default behavior that might interfere
      e.stopPropagation();
      
      // Ensure drawing controls remain visible
      setTimeout(ensureDrawControlsVisibility, 50);
    };
    
    const drawControls = document.querySelectorAll('.leaflet-draw-toolbar a');
    drawControls.forEach(button => {
      button.addEventListener('mousedown', handleDrawControlInteraction);
      button.addEventListener('click', handleDrawControlInteraction);
      button.addEventListener('mouseenter', ensureDrawControlsVisibility);
    });
    
    return () => {
      // Clean up draw control listeners
      const drawControls = document.querySelectorAll('.leaflet-draw-toolbar a');
      drawControls.forEach(button => {
        button.removeEventListener('mousedown', handleDrawControlInteraction);
        button.removeEventListener('click', handleDrawControlInteraction);
        button.removeEventListener('mouseenter', ensureDrawControlsVisibility);
      });
    };
  }, [ensureDrawControlsVisibility]);
  
  // Set up listeners for drawing controls
  useEffect(() => {
    // Initial setup of listeners
    const cleanup = addDrawControlListeners();
    
    // Set up an interval to ensure controls remain interactive
    const controlsInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      ensureDrawControlsVisibility();
      cleanup(); // Remove old listeners
      addDrawControlListeners(); // Add fresh listeners
    }, 1000);
    
    return () => {
      clearInterval(controlsInterval);
      cleanup();
    };
  }, [isMountedRef, ensureDrawControlsVisibility, addDrawControlListeners]);
}
