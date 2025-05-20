
import React, { useState, useEffect, CSSProperties } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumMap from '../../CesiumMap'; // Now using Three.js inside
import LeafletMap from '../../map/LeafletMap';
import { toast } from '@/components/ui/use-toast';

interface MapViewsProps {
  currentView: 'cesium' | 'leaflet';
  mapKey: number;
  selectedLocation: Location | undefined;
  onMapReady: () => void;
  onFlyComplete: () => void;
  handleCesiumViewerRef: (viewer: any) => void;
  handleLeafletMapRef: (map: any) => void;
  activeTool: string | null;
  handleClearAll: () => void;
}

const MapViews: React.FC<MapViewsProps> = ({
  currentView,
  mapKey,
  selectedLocation,
  onMapReady,
  onFlyComplete,
  handleCesiumViewerRef,
  handleLeafletMapRef,
  activeTool,
  handleClearAll
}) => {
  // Add transition state to handle smoother view changes
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Location | undefined>(undefined);
  const [fadeIn, setFadeIn] = useState(false);
  const [leafletKey, setLeafletKey] = useState<number>(Date.now());
  const [cesiumKey, setCesiumKey] = useState<number>(Date.now());
  
  // When view changes, generate a new key for the entering view to ensure fresh instance
  useEffect(() => {
    if (currentView === 'leaflet') {
      setLeafletKey(Date.now());
    } else {
      setCesiumKey(Date.now());
    }
  }, [currentView]);
  
  // Track location changes to prevent duplicate transitions
  useEffect(() => {
    if (selectedLocation && 
        (!lastSelectedLocation || 
         selectedLocation.id !== lastSelectedLocation.id)) {
      console.log('New location selected:', selectedLocation.label);
      setLastSelectedLocation(selectedLocation);
    }
  }, [selectedLocation, lastSelectedLocation]);
  
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
        
        // Trigger fade in for new view
        setFadeIn(true);
        setTimeout(() => setFadeIn(false), 500);
      }, 800); // Slightly longer to ensure render completes
      
      // Notify user about view change
      toast({
        title: `Switching to ${currentView === 'cesium' ? '3D Globe' : 'Map'} View`,
        description: "Please wait while the view changes...",
        duration: 2000,
      });
      
      return () => clearTimeout(timer);
    }
    
    setPreviousView(currentView);
  }, [currentView, previousView]);
  
  // Calculate transition progress for smoother animations
  const getTransitionStyles = (isCurrentView: boolean): React.CSSProperties => {
    if (!transitioning) {
      return {
        opacity: isCurrentView ? 1 : 0,
        transform: isCurrentView ? 'scale(1)' : 'scale(0.95)',
        zIndex: isCurrentView ? 10 : 0,
        visibility: isCurrentView ? 'visible' : 'hidden'
      };
    }
    
    // During transition, both views are visible but with different opacities
    return {
      opacity: isCurrentView ? 0.3 : 0.7, // Fading out current view, fading in new view
      transform: isCurrentView ? 'scale(0.95)' : 'scale(0.98)', // Zoom effect
      zIndex: isCurrentView ? 5 : 10, // New view on top during transition
      visibility: 'visible' // Both visible during transition
    };
  };
  
  // Get styles for current view
  const getCesiumStyles = (): React.CSSProperties => {
    const isCurrent = currentView === 'cesium';
    const styles = getTransitionStyles(!isCurrent);
    
    return {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      visibility: isCurrent ? 'visible' : 'hidden',
      opacity: isCurrent ? 1 : 0,
      transform: isCurrent ? 'scale(1)' : 'scale(0.95)',
      zIndex: isCurrent ? 10 : (transitioning ? 5 : 0),
      transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out',
      display: isCurrent || transitioning ? 'block' : 'none' // Only render when needed
    };
  };
  
  const getLeafletStyles = (): React.CSSProperties => {
    const isCurrent = currentView === 'leaflet';
    const styles = getTransitionStyles(!isCurrent);
    
    return {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      visibility: isCurrent ? 'visible' : 'hidden',
      opacity: isCurrent ? 1 : 0,
      transform: isCurrent ? 'scale(1)' : 'scale(0.95)',
      zIndex: isCurrent ? 10 : (transitioning ? 5 : 0),
      transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out',
      display: isCurrent || transitioning ? 'block' : 'none' // Only render when needed
    };
  };
  
  // Add fade-in effect when a view becomes active
  const fadeInClass = fadeIn ? 'animate-fade-in' : '';
  
  return (
    <>
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentView === 'cesium' ? fadeInClass : ''}`}
        style={getCesiumStyles()}
        data-map-type="cesium"
      >
        {(currentView === 'cesium' || transitioning) && (
          <CesiumMap 
            selectedLocation={selectedLocation}
            onMapReady={onMapReady}
            onFlyComplete={onFlyComplete}
            cinematicFlight={true}
            key={`cesium-${cesiumKey}`}
            onViewerReady={handleCesiumViewerRef}
          />
        )}
      </div>
      
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentView === 'leaflet' ? fadeInClass : ''}`}
        style={getLeafletStyles()}
        data-map-type="leaflet"
      >
        {(currentView === 'leaflet' || transitioning) && (
          <LeafletMap 
            selectedLocation={selectedLocation} 
            onMapReady={handleLeafletMapRef}
            activeTool={activeTool}
            key={`leaflet-${leafletKey}`}
            onClearAll={handleClearAll}
          />
        )}
      </div>
      
      {/* Add transition overlay */}
      {transitioning && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-30 z-20 pointer-events-none transition-opacity duration-300"
          style={{
            animation: 'fadeInOut 500ms ease-in-out forwards'
          }}
        />
      )}
    </>
  );
};

export default MapViews;
