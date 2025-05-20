
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
  fadeIn?: boolean;
  viewTransitionInProgress?: boolean;
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
  handleClearAll,
  fadeIn = false,
  viewTransitionInProgress = false
}) => {
  // Add transition state to handle smoother view changes
  const [transitioning, setTransitioning] = useState(viewTransitionInProgress);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Location | undefined>(undefined);
  
  // Update transitioning state when prop changes
  useEffect(() => {
    setTransitioning(viewTransitionInProgress);
  }, [viewTransitionInProgress]);
  
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
      }, 800); // Slightly longer to ensure render completes
      
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
    const styles = getTransitionStyles(isCurrent);
    
    return {
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      visibility: styles.visibility,
      opacity: styles.opacity,
      transform: styles.transform,
      zIndex: styles.zIndex,
      transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out'
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
      visibility: isCurrent || transitioning ? 'visible' : 'hidden',
      opacity: 1 - (styles.opacity as number),
      transform: isCurrent ? 'scale(1)' : 'scale(0.95)',
      zIndex: isCurrent ? 10 : (transitioning ? 5 : 0),
      transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out'
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
        <CesiumMap 
          selectedLocation={selectedLocation}
          onMapReady={onMapReady}
          onFlyComplete={onFlyComplete}
          cinematicFlight={true}
          key={`cesium-${mapKey}`}
          onViewerReady={handleCesiumViewerRef}
        />
      </div>
      
      <div 
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${currentView === 'leaflet' ? fadeInClass : ''}`}
        style={getLeafletStyles()}
        data-map-type="leaflet"
      >
        <LeafletMap 
          selectedLocation={selectedLocation} 
          onMapReady={handleLeafletMapRef}
          activeTool={activeTool}
          key={`leaflet-${mapKey}`}
          onClearAll={handleClearAll}
        />
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
