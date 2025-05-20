
import { useState, useEffect } from 'react';

interface UseMapTransitionProps {
  viewTransitionInProgress: boolean;
  currentView: 'cesium' | 'leaflet';
}

export function useMapTransition({ viewTransitionInProgress, currentView }: UseMapTransitionProps) {
  const [transitioning, setTransitioning] = useState(viewTransitionInProgress);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  
  // Update transitioning state when prop changes
  useEffect(() => {
    setTransitioning(viewTransitionInProgress);
  }, [viewTransitionInProgress]);
  
  // Handle view transitions with better initialization
  useEffect(() => {
    // If this is the first render, just set the previous view without transition
    if (previousView === null) {
      console.log(`Initial view set to ${currentView}`);
      setPreviousView(currentView);
      
      // If the currentView is cesium, we don't need to transition
      if (currentView === 'cesium') {
        setTransitioning(false);
        return;
      }
    }
    
    if (previousView !== currentView) {
      console.log(`View changing from ${previousView} to ${currentView}`);
      // Start transition effect
      setTransitioning(true);
      setViewChangeStarted(Date.now());
      
      // End transition after animation completes
      const timer = setTimeout(() => {
        setTransitioning(false);
        setViewChangeStarted(null);
      }, 800); // Slightly longer to ensure render completes
      
      return () => clearTimeout(timer);
    }
    
    setPreviousView(currentView);
  }, [currentView, previousView]);

  return {
    transitioning,
    viewChangeStarted
  };
}
