
import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapView from '../../components/map/MapView';
import { useMapState } from '../../hooks/useMapState';
import { Location } from '../../utils/geo-utils';
import { setUserSession, loadUserData, saveUserData, clearUserSession, getCurrentUser } from '../../services/user-data-service';
import { toast } from 'sonner';

export interface StandaloneMapProps {
  // Map configuration
  initialCenter?: [number, number];
  initialZoom?: number;
  
  // External location control
  externalLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
  
  // UI options
  showInternalSearch?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  
  // RBAC configuration
  userSession?: {
    userId: string;
    username?: string;
    connectionString: string;
    autoSync?: boolean;
  };
  
  // Event handlers
  onLocationChange?: (location: {
    latitude: number;
    longitude: number;
    searchString?: string;
  }) => void;
  onAnnotationsChange?: (annotations: any[]) => void;
  onDataSync?: (success: boolean, operation: 'load' | 'save') => void;
  
  // Map interaction handlers
  onMapReady?: (map: any) => void;
  onMarkerClick?: (marker: any) => void;
  onDrawingClick?: (drawing: any) => void;
}

export const StandaloneMapComponent: React.FC<StandaloneMapProps> = ({
  initialCenter = [51.505, -0.09],
  initialZoom = 18,
  externalLocation,
  showInternalSearch = true,
  theme = 'light',
  className = '',
  userSession,
  onLocationChange,
  onAnnotationsChange,
  onDataSync,
  onMapReady,
  onMarkerClick,
  onDrawingClick
}) => {
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
      
      if (onMapReady) {
        onMapReady(map);
      }
    }
  }, [onMapReady]);

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
    // Handle shape creation logic here
  }, []);

  const handleClearAll = useCallback(() => {
    // Clear all data
    setMarkers([]);
    setDrawings([]);
    setTempMarker(null);
    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('svgPaths');
    
    // Notify components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('drawingsUpdated'));
    
    toast.success('All annotations cleared');
  }, [setMarkers, setDrawings, setTempMarker]);

  const handleMarkerClickInternal = useCallback((marker: any) => {
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

  const handleDrawingClickInternal = useCallback((drawing: any) => {
    handleRegionClick(drawing);
    if (onDrawingClick) {
      onDrawingClick(drawing);
    }
  }, [handleRegionClick, onDrawingClick]);

  // Public methods for external control
  const saveToAzure = useCallback(async () => {
    if (!userSession) {
      toast.error('No user session configured');
      return false;
    }
    
    try {
      const success = await saveUserData();
      if (onDataSync) {
        onDataSync(success, 'save');
      }
      return success;
    } catch (error) {
      console.error('Save failed:', error);
      if (onDataSync) {
        onDataSync(false, 'save');
      }
      return false;
    }
  }, [userSession, onDataSync]);

  const loadFromAzure = useCallback(async () => {
    if (!userSession) {
      toast.error('No user session configured');
      return false;
    }
    
    try {
      const success = await loadUserData();
      if (onDataSync) {
        onDataSync(success, 'load');
      }
      return success;
    } catch (error) {
      console.error('Load failed:', error);
      if (onDataSync) {
        onDataSync(false, 'load');
      }
      return false;
    }
  }, [userSession, onDataSync]);

  // Expose methods via ref (if needed)
  React.useImperativeHandle(React.useRef(), () => ({
    saveToAzure,
    loadFromAzure,
    getCurrentUser,
    clearAll: handleClearAll
  }));

  return (
    <div className={`standalone-map-container ${theme} ${className}`} style={{ width: '100%', height: '100%' }}>
      <MapView
        position={position}
        zoom={zoom}
        markers={markers}
        tempMarker={tempMarker}
        markerName={markerName}
        markerType={markerType}
        onMapReady={handleMapReady}
        onLocationSelect={handleLocationSelect}
        onMapClick={handleMapClick}
        onDeleteMarker={handleDeleteMarker}
        onSaveMarker={handleSaveMarker}
        setMarkerName={setMarkerName}
        setMarkerType={setMarkerType}
        onShapeCreated={handleShapeCreated}
        activeTool={activeTool}
        onRegionClick={handleDrawingClickInternal}
        onClearAll={handleClearAll}
        isMapReady={isMapReady}
        selectedLocation={selectedLocation}
        onClearSelectedLocation={() => {
          if (onLocationChange) {
            onLocationChange({ latitude: position[0], longitude: position[1] });
          }
        }}
      />
      
      {userSession && (
        <div className="absolute top-2 right-2 z-[1000] flex gap-2">
          <button
            onClick={saveToAzure}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="Save to Azure SQL"
          >
            Save
          </button>
          <button
            onClick={loadFromAzure}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            title="Load from Azure SQL"
          >
            Load
          </button>
        </div>
      )}
    </div>
  );
};

export default StandaloneMapComponent;
