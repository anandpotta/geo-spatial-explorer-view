
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useViewTransition(
  currentView: 'cesium' | 'leaflet',
  previousViewRef: React.MutableRefObject<string | null>,
  setViewTransitionInProgress: (value: boolean) => void,
  setMapKey: (value: number) => void,
  setMapReady: (value: boolean) => void
) {
  const [fadeIn, setFadeIn] = useState(false);

  // Reset map instance when view changes
  useEffect(() => {
    // Only regenerate key when view type actually changes
    if (previousViewRef.current !== currentView) {
      console.log(`View changed from ${previousViewRef.current} to ${currentView}, regenerating map key`);
      setMapKey(Date.now());
      previousViewRef.current = currentView;
      
      // Set transition flag
      setViewTransitionInProgress(true);
      const timer = setTimeout(() => {
        setViewTransitionInProgress(false);
        setMapReady(false);
      }, 1000); // Allow time for transition to complete
      
      // Notify user about view change
      toast({
        title: `Switching to ${currentView === 'cesium' ? '3D Globe' : 'Map'} View`,
        description: "Please wait while the view changes...",
        duration: 2000,
      });
      
      return () => clearTimeout(timer);
    }
  }, [currentView, previousViewRef, setMapKey, setViewTransitionInProgress, setMapReady]);

  // Handle fade in effect
  const triggerFadeIn = () => {
    setFadeIn(true);
    setTimeout(() => setFadeIn(false), 500);
  };

  return {
    fadeIn,
    triggerFadeIn
  };
}
