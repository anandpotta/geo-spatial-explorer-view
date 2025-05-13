import React, { useState, useEffect, CSSProperties, useRef } from 'react';
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
  viewTransitionReady?: boolean;
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
  viewTransitionReady = true,
  viewTransitionInProgress = false
}) => {
  // Add transition state to handle smoother view changes
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Location | undefined>(undefined);
  const [fadeIn, setFadeIn] = useState(false);
  const bothViewsReadyRef = useRef<boolean>(false);
  const [preloadedLeaflet, setPreloadedLeaflet] = useState(false);
  
  // Track location changes to prevent duplicate transitions
  useEffect(() => {
    if (selectedLocation && 
        (!lastSelectedLocation || 
         selectedLocation.id !== lastSelectedLocation.id)) {
      console.log('New location selected:', selectedLocation.label);
      setLastSelectedLocation(selectedLocation);
    }
  }, [selectedLocation, lastSelectedLocation]);
  
  // Preload the leaflet map in the background when in globe view
  useEffect(() => {
    if (currentView === 'cesium' && !preloadedLeaflet && viewTransitionReady) {
      // Only preload once 
      setPreloadedLeaflet(true);
    }
  }, [currentView, preloadedLeaflet, viewTransitionReady]);
  
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
        setTimeout(() => setFadeIn(false), 400); 
      }, 600); // Slightly shorter for smoother transition
      
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
      opacity: isCurrentView ? 0.2 : 0.8, // Faster fade out for current view
      transform: isCurrentView ? 'scale(0.97)' : 'scale(0.99)', // Subtle zoom effect
      zIndex: isCurrentView ? 5 : 10, // New view on top during transition
      visibility: 'visible' // Both visible during transition
    };
  };
  
  // Get styles for current view
  const getCesiumStyles = (): React.CSSProperties => {
    const isCurrent = currentView === 'cesium';
    const styles = getTransitionStyles(isCurrent);
    
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
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
      transition: 'opacity 400ms ease-in-out, transform 400ms ease-in-out' // Faster transition
    };
    
    return baseStyles;
  };
  
  const getLeafletStyles = (): React.CSSProperties => {
    const isCurrent = currentView === 'leaflet';
    const styles = getTransitionStyles(!isCurrent);
    
    // For leaflet, we want to keep it preloaded in the background but invisible
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      // Show when current view or during transition or when preloaded
      visibility: isCurrent || transitioning || preloadedLeaflet ? 'visible' : 'hidden',
      opacity: 1 - (styles.opacity as number),
      transform: isCurrent ? 'scale(1)' : 'scale(0.98)',
      zIndex: isCurrent ? 10 : (transitioning ? 5 : 1),
      transition: 'opacity 400ms ease-in-out, transform 400ms ease-in-out' // Faster transition
    };
    
    return baseStyles;
  };
  
  // Add fade-in effect when a view becomes active
  const fadeInClass = fadeIn ? 'animate-fade-in' : '';
  
  // Handle both maps loaded to enable smoother transitions
  const handleBothMapsReady = () => {
    if (!bothViewsReadyRef.current) {
      bothViewsReadyRef.current = true;
    }
  };
  
  return (
    <>
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-in-out ${currentView === 'cesium' ? fadeInClass : ''}`}
        style={getCesiumStyles()}
        data-map-type="cesium"
      >
        <CesiumMap 
          selectedLocation={selectedLocation}
          onMapReady={() => {
            onMapReady();
            handleBothMapsReady();
          }}
          onFlyComplete={onFlyComplete}
          cinematicFlight={true}
          key={`cesium-${mapKey}`}
          onViewerReady={handleCesiumViewerRef}
        />
      </div>
      
      {/* Keep leaflet always rendered but with controlled visibility for faster transitions */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-in-out ${currentView === 'leaflet' ? fadeInClass : ''}`}
        style={getLeafletStyles()}
        data-map-type="leaflet"
      >
        <LeafletMap 
          selectedLocation={selectedLocation} 
          onMapReady={(map) => {
            handleLeafletMapRef(map);
            handleBothMapsReady();
          }}
          activeTool={activeTool}
          key={`leaflet-${mapKey}`}
          onClearAll={handleClearAll}
          preload={preloadedLeaflet}
        />
      </div>
      
      {/* Add transition overlay - subtle fade effect during transitions */}
      {transitioning && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-20 z-20 pointer-events-none"
          style={{
            animation: 'fadeInOut 400ms ease-in-out forwards'
          }}
        />
      )}
    </>
  );
};

export default MapViews;
