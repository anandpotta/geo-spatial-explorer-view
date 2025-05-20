
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
  
  // Handle view transitions
  useEffect(() => {
    if (previousView && previousView !== currentView) {
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
