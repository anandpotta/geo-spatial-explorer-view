
import { useState, useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useMapViewTransition(currentView: string) {
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState<string | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const viewChangeTimeout = useRef<number | null>(null);
  
  // Handle view transitions
  useEffect(() => {
    if (previousView && previousView !== currentView) {
      // Clear any existing timeout
      if (viewChangeTimeout.current) {
        window.clearTimeout(viewChangeTimeout.current);
      }
      
      // Start transition effect
      setTransitioning(true);
      setViewChangeStarted(Date.now());
      
      // End transition after animation completes
      viewChangeTimeout.current = window.setTimeout(() => {
        setTransitioning(false);
        setViewChangeStarted(null);
        
        // Trigger fade in for new view
        setFadeIn(true);
        const fadeTimeout = window.setTimeout(() => setFadeIn(false), 500);
        
        return () => window.clearTimeout(fadeTimeout);
      }, 800); // Slightly longer to ensure render completes
      
      // Notify user about view change
      toast({
        title: `Switching to ${currentView === 'cesium' ? '3D Globe' : 'Map'} View`,
        description: "Please wait while the view changes...",
        duration: 2000,
      });
      
      return () => {
        if (viewChangeTimeout.current) {
          window.clearTimeout(viewChangeTimeout.current);
          viewChangeTimeout.current = null;
        }
      };
    }
    
    setPreviousView(currentView);
  }, [currentView, previousView]);
  
  return {
    transitioning,
    previousView,
    viewChangeStarted,
    fadeIn,
    viewChangeTimeout
  };
}
