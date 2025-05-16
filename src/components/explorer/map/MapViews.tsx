
import React, { useState, useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import CesiumView from './views/CesiumView';
import LeafletView from './views/LeafletView';
import TransitionEffect from './views/TransitionEffect';

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
  // State management for transitions
  const [transitioning, setTransitioning] = useState(false);
  const [previousView, setPreviousView] = useState<'cesium' | 'leaflet' | null>(null);
  const [viewChangeStarted, setViewChangeStarted] = useState<number | null>(null);
  const [lastSelectedLocation, setLastSelectedLocation] = useState<Location | undefined>(undefined);
  const [fadeIn, setFadeIn] = useState(false);
  const bothViewsReadyRef = useRef<boolean>(false);
  const [preloadedLeaflet, setPreloadedLeaflet] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keys to force remount of the inactive map when switching
  const [leafletKey, setLeafletKey] = useState(`leaflet-${mapKey}`);
  const [cesiumKey, setCesiumKey] = useState(`cesium-${mapKey}`);
  
  // Track location changes to prevent duplicate transitions
  useEffect(() => {
    if (selectedLocation && 
        (!lastSelectedLocation || 
         selectedLocation.id !== lastSelectedLocation.id)) {
      console.log('New location selected:', selectedLocation.label);
      setLastSelectedLocation(selectedLocation);
    }
  }, [selectedLocation, lastSelectedLocation]);
  
  // Regenerate keys when the main map key changes
  useEffect(() => {
    setCesiumKey(`cesium-${mapKey}`);
    setLeafletKey(`leaflet-${mapKey}`);
  }, [mapKey]);
  
  // Always preload the leaflet map for smoother transitions
  useEffect(() => {
    // Always preload after a short delay
    const preloadTimer = setTimeout(() => {
      if (!preloadedLeaflet) {
        setPreloadedLeaflet(true);
        console.log("Preloading Leaflet view for smoother transitions");
      }
    }, 2000); // Short delay before preloading
    
    return () => clearTimeout(preloadTimer);
  }, [preloadedLeaflet]);
  
  // Handle view transitions
  useEffect(() => {
    if (previousView && previousView !== currentView) {
      // Start transition effect
      setTransitioning(true);
      setViewChangeStarted(Date.now());
      
      // For the view we're switching to, generate a new key to force remount
      if (currentView === 'leaflet') {
        setLeafletKey(`leaflet-${Date.now()}`);
      } else {
        setCesiumKey(`cesium-${Date.now()}`);
      }
      
      // Clear any existing transition timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      // End transition after animation completes - longer duration for smoother transition
      transitionTimerRef.current = setTimeout(() => {
        setTransitioning(false);
        setViewChangeStarted(null);
        
        // Trigger fade in for new view
        setFadeIn(true);
        setTimeout(() => setFadeIn(false), 600);
        
        transitionTimerRef.current = null;
      }, 800); // Longer for smoother transition
    }
    
    setPreviousView(currentView);
    
    // Cleanup function
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [currentView, previousView]);
  
  // Handle both maps loaded to enable smoother transitions
  const handleBothMapsReady = () => {
    if (!bothViewsReadyRef.current) {
      bothViewsReadyRef.current = true;
    }
  };

  // Handle Leaflet map ready callback with additional logic
  const handleLeafletMapReady = (map: any) => {
    handleLeafletMapRef(map);
    handleBothMapsReady();
    
    // When Leaflet is active, make sure to trigger onMapReady
    if (currentView === 'leaflet') {
      // Add small delay to ensure map is fully rendered
      setTimeout(() => {
        console.log("Leaflet map fully ready");
        onMapReady();
      }, 300);
    }
  };

  // Handle Cesium map ready callback
  const handleCesiumMapReady = () => {
    onMapReady();
    handleBothMapsReady();
  };

  return (
    <>
      {/* Cesium Globe View */}
      <CesiumView
        currentView={currentView}
        transitioning={transitioning}
        viewTransitionInProgress={viewTransitionInProgress || false}
        selectedLocation={selectedLocation}
        cesiumKey={cesiumKey}
        onMapReady={handleCesiumMapReady}
        onFlyComplete={onFlyComplete}
        onViewerReady={handleCesiumViewerRef}
        fadeIn={fadeIn}
      />
      
      {/* Leaflet Map View - Always render but control visibility with CSS */}
      <LeafletView
        currentView={currentView}
        transitioning={transitioning}
        preloadedLeaflet={preloadedLeaflet}
        selectedLocation={selectedLocation}
        leafletKey={leafletKey}
        onMapReady={handleLeafletMapReady}
        activeTool={activeTool}
        onClearAll={handleClearAll}
        fadeIn={fadeIn}
      />
      
      {/* Transition overlay effect */}
      <TransitionEffect transitioning={transitioning} />
    </>
  );
};

export default MapViews;
