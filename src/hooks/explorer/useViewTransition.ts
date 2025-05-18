
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useViewTransition(
  flyCompleted: boolean, 
  shouldSwitchToLeaflet: boolean, 
  setShouldSwitchToLeaflet: (value: boolean) => void,
  selectedLocation?: Location,
  isTransitionInProgress?: () => boolean
) {
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const viewTransitionInProgressRef = useRef(false);
  const [viewTransitionReady, setViewTransitionReady] = useState(true);
  const leafletReadyRef = useRef(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingViewChangeRef = useRef<'cesium' | 'leaflet' | null>(null);
  const transitionLockedRef = useRef(false);
  const transitionLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  // Lock transitions briefly to prevent rapid view switching
  const lockTransition = useCallback(() => {
    transitionLockedRef.current = true;
    
    if (transitionLockTimerRef.current) {
      clearTimeout(transitionLockTimerRef.current);
    }
    
    transitionLockTimerRef.current = setTimeout(() => {
      transitionLockedRef.current = false;
      
      // Process any pending view change after lock expires
      if (pendingViewChangeRef.current) {
        const nextView = pendingViewChangeRef.current;
        pendingViewChangeRef.current = null;
        handleViewChange(nextView);
      }
    }, 1000);
  }, []);

  // Effect to handle automatic switching to leaflet after fly completes
  useEffect(() => {
    if (flyCompleted && shouldSwitchToLeaflet && currentView === 'cesium') {
      console.log("Preparing transition to leaflet view after fly completion");
      
      // Prevent multiple transition attempts
      if (viewTransitionInProgressRef.current || transitionLockedRef.current) {
        console.log("Transition already in progress or locked, delaying leaflet switch");
        pendingViewChangeRef.current = 'leaflet';
        return;
      }
      
      // Set the transition flag
      viewTransitionInProgressRef.current = true;
      setViewTransitionReady(false);
      lockTransition();
      
      // Start transition to leaflet with a slight delay to ensure smooth visual experience
      transitionTimerRef.current = setTimeout(() => {
        setCurrentView('leaflet');
        setShouldSwitchToLeaflet(false);
        
        // Show toast with location info after transition starts
        if (selectedLocation) {
          toast({
            title: "Navigation Complete",
            description: `Now showing ${selectedLocation.label}`,
            duration: 3000,
          });
        }
        
        // Reset transition flags after animation completes
        transitionTimerRef.current = setTimeout(() => {
          viewTransitionInProgressRef.current = false;
          setViewTransitionReady(true);
        }, 800);
      }, 200);
    }
    
    return () => clearTransitionTimer();
  }, [flyCompleted, shouldSwitchToLeaflet, currentView, selectedLocation, setShouldSwitchToLeaflet, clearTransitionTimer, lockTransition]);

  const handleViewChange = useCallback((view: 'cesium' | 'leaflet') => {
    // Don't allow view changes during transitions or when locked
    if (viewTransitionInProgressRef.current || (isTransitionInProgress && isTransitionInProgress())) {
      toast({
        title: "Please wait",
        description: "View transition already in progress",
        duration: 2000,
      });
      
      // Queue this view change for later
      pendingViewChangeRef.current = view;
      return;
    }
    
    if (transitionLockedRef.current) {
      console.log("View change locked, queueing for later");
      pendingViewChangeRef.current = view;
      return;
    }
    
    // Don't allow switching to leaflet until fly is completed
    if (view === 'leaflet' && !flyCompleted && selectedLocation) {
      toast({
        title: "Please wait",
        description: "Wait for navigation to complete before switching views",
        duration: 2000,
      });
      return;
    }
    
    // Don't switch to the view we're already on
    if (currentView === view) {
      console.log(`Already on ${view} view, ignoring change request`);
      return;
    }
    
    console.log(`Changing view to ${view}`);
    setViewTransitionReady(false); // Start transition
    viewTransitionInProgressRef.current = true;
    lockTransition(); // Lock to prevent rapid switching
    
    clearTransitionTimer();
    
    // Change view with a slight delay for better visual transition
    transitionTimerRef.current = setTimeout(() => {
      setCurrentView(view);
      setShouldSwitchToLeaflet(false); // Reset switch flag when manually changing view
      
      // End transition after animation completes
      transitionTimerRef.current = setTimeout(() => {
        viewTransitionInProgressRef.current = false;
        setViewTransitionReady(true);
      }, 800);
    }, 100);
  }, [flyCompleted, selectedLocation, setShouldSwitchToLeaflet, isTransitionInProgress, clearTransitionTimer, lockTransition, currentView]);

  const handleMapReady = useCallback(() => {
    console.log('Map is ready');
    
    // If this is the leaflet map becoming ready, mark it
    if (currentView === 'leaflet') {
      leafletReadyRef.current = true;
    }
    
    // Allow a small delay for map rendering before marking ready
    transitionTimerRef.current = setTimeout(() => {
      setViewTransitionReady(true);
    }, 200);
  }, [currentView]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      clearTransitionTimer();
      
      if (transitionLockTimerRef.current) {
        clearTimeout(transitionLockTimerRef.current);
        transitionLockTimerRef.current = null;
      }
    };
  }, [clearTransitionTimer]);

  return {
    currentView,
    viewTransitionReady,
    handleViewChange,
    handleMapReady,
    isViewTransitionInProgress: viewTransitionInProgressRef.current
  };
}
