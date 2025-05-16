
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
      
      // For the view we're switching to, generate a new key to force remount
      if (currentView === 'leaflet') {
        setLeafletKey(`leaflet-${Date.now()}`);
      } else {
        setCesiumKey(`cesium-${Date.now()}`);
      }
      
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
      onMapReady();
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
      
      {/* Leaflet Map View */}
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
