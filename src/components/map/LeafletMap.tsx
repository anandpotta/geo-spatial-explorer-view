
import { useEffect, useRef } from 'react';
import { Location } from '@/utils/geo-utils';
import { useMapState } from '@/hooks/useMapState';
import { useMapEvents } from '@/hooks/useMapEvents';
import { useLeafletMapInitialization } from '@/hooks/useLeafletMapInitialization';
import { useLeafletMapNavigation } from '@/hooks/useLeafletMapNavigation';
import { useMarkerHandlers } from '@/hooks/useMarkerHandlers';
import { useMapReferenceHandler } from '@/hooks/useMapReferenceHandler';
import { toast } from 'sonner';
import MapView from './MapView';
import FloorPlanView from './FloorPlanView';
import MapCleanup from './MapCleanup';

interface LeafletMapProps {
  selectedLocation?: Location;
  onMapReady?: (map: L.Map) => void;
  activeTool?: string | null;
  onLocationSelect?: (location: Location) => void;
}

const LeafletMap = ({ 
  selectedLocation, 
  onMapReady, 
  activeTool, 
  onLocationSelect 
}: LeafletMapProps) => {
  const {
    mapRef,
    mapInstanceKey,
    isMapInitialized,
    mapReadyAttempts,
    cleanupInProgress,
    mapInitializedSuccessfully,
    mapContainerId,
    setIsMapInitialized,
    setMapReadyAttempts,
    resetMap
  } = useLeafletMapInitialization();

  const { safeMapFlyTo, handleLocationSelect, initialNavigationDone } = useLeafletMapNavigation();
  const mapState = useMapState(selectedLocation);
  const { handleMapClick, handleShapeCreated } = useMarkerHandlers(mapState);
  
  // Track if we need to perform initial navigation
  const needsInitialNavigation = useRef(true);

  const handleSetMapRef = useMapReferenceHandler(
    mapRef,
    isMapInitialized,
    cleanupInProgress,
    setIsMapInitialized,
    mapInitializedSuccessfully,
    mapReadyAttempts,
    setMapReadyAttempts,
    onMapReady
  );

  // Handle location changes with improved timing, but only for initial navigation
  useEffect(() => {
    // Skip if location or map isn't ready
    if (!selectedLocation || !mapRef.current || !needsInitialNavigation.current) return;
    
    // Add a longer initial delay to ensure map is properly initialized
    const initialDelay = 1000; 
    
    // Use a timer to wait for map to be fully initialized
    const navigationTimer = setTimeout(() => {
      if (!isMapInitialized || !mapRef.current || cleanupInProgress.current) {
        console.log('Map not ready for navigation yet');
        return;
      }
      
      try {
        const lat = selectedLocation.y;
        const lng = selectedLocation.x;
        
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', { lat, lng });
          toast.error('Invalid location coordinates');
          return;
        }
        
        console.log('Flying to location:', { lat, lng });
        
        // Add a small delay before actual navigation
        const flyTimer = setTimeout(() => {
          const flySuccess = safeMapFlyTo(
            mapRef.current, 
            isMapInitialized, 
            cleanupInProgress.current, 
            lat, 
            lng,
            18,
            true // Force the navigation
          );
          
          // Only reset map if flyTo completely failed and we're not already cleaning up
          if (!flySuccess && !cleanupInProgress.current && needsInitialNavigation.current) {
            console.warn('Safe flyTo failed, recreating map');
            resetMap();
          } else {
            // Mark that initial navigation is completed
            needsInitialNavigation.current = false;
          }
        }, 800); // Longer delay for navigation attempt
        
        return () => clearTimeout(flyTimer);
      } catch (err) {
        console.error('Error flying to location:', err);
        // Only reset if truly needed
        if (needsInitialNavigation.current) {
          resetMap();
        }
      }
    }, initialDelay);
    
    // Clean up the timer if component unmounts
    return () => clearTimeout(navigationTimer);
  }, [selectedLocation, isMapInitialized, safeMapFlyTo, resetMap, cleanupInProgress]);

  // Use mapEvents hook with safeguards
  // Pass the initialNavigationDone ref to prevent automatic re-navigation
  useMapEvents(isMapInitialized ? mapRef.current : null, selectedLocation, initialNavigationDone);

  const handleSavedLocationSelect = (position: [number, number]) => {
    console.log("Location selected in LeafletMap:", position);
    handleLocationSelect(position, onLocationSelect);
    
    const [lat, lng] = position;
    if (mapRef.current && isMapInitialized && !cleanupInProgress.current) {
      try {
        // Add a delay before navigation
        setTimeout(() => {
          if (!mapRef.current || !isMapInitialized || cleanupInProgress.current) return;
          // Force navigation when explicitly selected by user
          safeMapFlyTo(mapRef.current, isMapInitialized, cleanupInProgress.current, lat, lng, 18, true);
        }, 500);
      } catch (err) {
        console.error('Error flying to location:', err);
      }
    }
  };

  if (mapState.showFloorPlan) {
    return (
      <FloorPlanView 
        onBack={() => mapState.setShowFloorPlan(false)} 
        drawing={mapState.selectedDrawing}
      />
    );
  }

  return (
    <>
      <MapCleanup
        mapInstanceKey={mapInstanceKey}
        mapRef={mapRef}
        cleanupInProgress={cleanupInProgress}
        mapContainerId={mapContainerId}
      />
      <MapView
        key={`map-view-${mapInstanceKey}`}
        position={mapState.position}
        zoom={mapState.zoom}
        markers={mapState.markers}
        tempMarker={mapState.tempMarker}
        markerName={mapState.markerName}
        markerType={mapState.markerType}
        onMapReady={handleSetMapRef}
        onLocationSelect={handleSavedLocationSelect}
        onMapClick={handleMapClick}
        onDeleteMarker={mapState.handleDeleteMarker}
        onSaveMarker={mapState.handleSaveMarker}
        setMarkerName={mapState.setMarkerName}
        setMarkerType={mapState.setMarkerType}
        onShapeCreated={handleShapeCreated}
        activeTool={activeTool || mapState.activeTool}
        onRegionClick={mapState.handleRegionClick}
        onClearAll={mapState.handleClearAll}
        mapContainerId={mapContainerId.current}
      />
    </>
  );
};

export default LeafletMap;
