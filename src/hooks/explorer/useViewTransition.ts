import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useViewTransition(
  flyCompleted: boolean, 
  shouldSwitchToLeaflet: boolean, 
  setShouldSwitchToLeaflet: (value: boolean) => void,
  selectedLocation?: Location
) {
  const [currentView, setCurrentView] = useState<'cesium' | 'leaflet'>('cesium');
  const viewTransitionInProgressRef = useRef(false);
  const [viewTransitionReady, setViewTransitionReady] = useState(true);
  const leafletReadyRef = useRef(false);

  // Effect to handle automatic switching to leaflet after fly completes
  useEffect(() => {
    if (flyCompleted && shouldSwitchToLeaflet && currentView === 'cesium') {
      console.log("Preparing transition to leaflet view after fly completion");
      
      // Start transition to leaflet immediately but keep transition state
      // to ensure smooth visual transition
      setCurrentView('leaflet');
      setShouldSwitchToLeaflet(false);
      
      // Slight delay before showing toast for better UX
      setTimeout(() => {
        // Show toast with location info
        if (selectedLocation) {
          toast({
            title: "Navigation Complete",
            description: `Now showing ${selectedLocation.label}`,
            duration: 3000,
          });
        }
        
        // Reset view transition ready state slightly later
        setTimeout(() => {
          setViewTransitionReady(true);
        }, 300);
      }, 500);
    }
  }, [flyCompleted, shouldSwitchToLeaflet, currentView, selectedLocation, setShouldSwitchToLeaflet]);

  const handleViewChange = (view: 'cesium' | 'leaflet') => {
    // Prevent rapid view changes
    if (viewTransitionInProgressRef.current) {
      toast({
        title: "Please wait",
        description: "View transition already in progress",
        duration: 2000,
      });
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
    
    console.log(`Changing view to ${view}`);
    setViewTransitionReady(false); // Start transition
    setCurrentView(view);
    setShouldSwitchToLeaflet(false); // Reset switch flag when manually changing view
    
    // Set transition flag
    viewTransitionInProgressRef.current = true;
    setTimeout(() => {
      viewTransitionInProgressRef.current = false;
      setViewTransitionReady(true); // End transition
    }, 800); // Slightly faster transition
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    
    // If this is the leaflet map becoming ready, mark it
    if (currentView === 'leaflet') {
      leafletReadyRef.current = true;
    }
    
    // Allow a small delay for map rendering before marking ready
    setTimeout(() => {
      setViewTransitionReady(true);
    }, 200);
  };

  // Manage view transition effects
  useEffect(() => {
    if (!viewTransitionReady) {
      // If transition is happening, set a backup timer to ensure we don't get stuck
      const timer = setTimeout(() => {
        setViewTransitionReady(true);
      }, 2000); // Shorter timeout
      return () => clearTimeout(timer);
    }
  }, [viewTransitionReady]);

  return {
    currentView,
    viewTransitionReady,
    handleViewChange,
    handleMapReady
  };
}
