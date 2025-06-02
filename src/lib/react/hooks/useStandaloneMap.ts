
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapState } from '../../../hooks/useMapState';
import { Location } from '../../../utils/geo-utils';
import { setUserSession, loadUserData, saveUserData, clearUserSession, getCurrentUser } from '../../../services/user-data-service';
import { StandaloneMapProps } from '../types/standalone-map-types';

export function useStandaloneMap({
  initialCenter = [51.505, -0.09],
  externalLocation,
  userSession,
  onLocationChange,
  onAnnotationsChange,
  onDataSync
}: Pick<StandaloneMapProps, 'initialCenter' | 'externalLocation' | 'userSession' | 'onLocationChange' | 'onAnnotationsChange' | 'onDataSync'>) {
  const mapReadyRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    searchString?: string;
  } | null>(null);

  // Initialize user session if provided
  useEffect(() => {
    if (userSession) {
      setUserSession(
        userSession.userId,
        userSession.connectionString,
        userSession.username,
        userSession.autoSync
      );
      
      // Auto-load user data on session start
      loadUserData()
        .then((success) => {
          if (onDataSync) {
            onDataSync(success, 'load');
          }
        })
        .catch((error) => {
          console.error('Failed to load user data:', error);
          if (onDataSync) {
            onDataSync(false, 'load');
          }
        });
    }
    
    return () => {
      if (userSession) {
        clearUserSession();
      }
    };
  }, [userSession, onDataSync]);

  // Convert external location to selected location format
  const selectedLocation: Location | undefined = externalLocation ? {
    x: externalLocation.longitude,
    y: externalLocation.latitude,
    label: externalLocation.searchString || `${externalLocation.latitude}, ${externalLocation.longitude}`,
    id: 'external-location'
  } : undefined;

  const {
    position,
    setPosition,
    zoom,
    setZoom,
    markers,
    setMarkers,
    drawings,
    setDrawings,
    tempMarker,
    setTempMarker,
    markerName,
    setMarkerName,
    markerType,
    setMarkerType,
    activeTool,
    setActiveTool,
    handleSaveMarker,
    handleDeleteMarker,
    handleRenameMarker,
    handleRegionClick
  } = useMapState(selectedLocation);

  // Update position when external location changes
  useEffect(() => {
    if (externalLocation) {
      setPosition([externalLocation.latitude, externalLocation.longitude]);
      setCurrentLocation(externalLocation);
      
      if (onLocationChange) {
        onLocationChange(externalLocation);
      }
    }
  }, [externalLocation, setPosition, onLocationChange]);

  // Monitor annotations changes
  useEffect(() => {
    if (onAnnotationsChange) {
      const allAnnotations = [...markers, ...drawings];
      onAnnotationsChange(allAnnotations);
    }
  }, [markers, drawings, onAnnotationsChange]);

  const handleMapReady = useCallback((map: any) => {
    if (!mapReadyRef.current) {
      mapReadyRef.current = true;
      setIsMapReady(true);
      console.log('Standalone map is ready');
    }
  }, []);

  const handleLocationSelect = useCallback((newPosition: [number, number]) => {
    setPosition(newPosition);
    
    const location = {
      latitude: newPosition[0],
      longitude: newPosition[1],
      searchString: `${newPosition[0].toFixed(4)}, ${newPosition[1].toFixed(4)}`
    };
    
    setCurrentLocation(location);
    
    if (onLocationChange) {
      onLocationChange(location);
    }
  }, [setPosition, onLocationChange]);

  const handleMapClick = useCallback((latlng: any) => {
    const newPosition: [number, number] = [latlng.lat, latlng.lng];
    setTempMarker(newPosition);
  }, [setTempMarker]);

  const handleShapeCreated = useCallback((shape: any) => {
    console.log('Shape created:', shape);
  }, []);

  const handleClearAll = useCallback(() => {
    setMarkers([]);
    setDrawings([]);
    setTempMarker(null);
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('svgPaths');
    
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
  }, [setMarkers, setDrawings, setTempMarker]);

  return {
    mapState: {
      position,
      zoom,
      markers,
      drawings,
      tempMarker,
      markerName,
      markerType,
      activeTool,
      isMapReady,
      selectedLocation
    },
    mapActions: {
      setPosition,
      setZoom,
      setMarkers,
      setDrawings,
      setTempMarker,
      setMarkerName,
      setMarkerType,
      setActiveTool,
      handleSaveMarker,
      handleDeleteMarker,
      handleRenameMarker,
      handleRegionClick,
      handleMapReady,
      handleLocationSelect,
      handleMapClick,
      handleShapeCreated,
      handleClearAll
    }
  };
}
