
import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import MapView from '../../components/map/MapView';
import { useStandaloneMap } from './hooks/useStandaloneMap';
import { AzureControls } from './components/AzureControls';
import { loadUserData, saveUserData, getCurrentUser } from '../../services/user-data-service';
import { toast } from 'sonner';
import { StandaloneMapProps, StandaloneMapRef } from './types/standalone-map-types';

export const StandaloneMapComponent = forwardRef<StandaloneMapRef, StandaloneMapProps>(({
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
}, ref) => {
  const { mapState, mapActions } = useStandaloneMap({
    initialCenter,
    externalLocation,
    userSession,
    onLocationChange,
    onAnnotationsChange,
    onDataSync
  });

  const handleMapReady = useCallback((map: any) => {
    mapActions.handleMapReady(map);
    if (onMapReady) {
      onMapReady(map);
    }
  }, [mapActions.handleMapReady, onMapReady]);

  const handleMarkerClick = useCallback((marker: any) => {
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

  const handleDrawingClick = useCallback((drawing: any) => {
    mapActions.handleRegionClick(drawing);
    if (onDrawingClick) {
      onDrawingClick(drawing);
    }
  }, [mapActions.handleRegionClick, onDrawingClick]);

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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    saveToAzure,
    loadFromAzure,
    getCurrentUser,
    clearAll: mapActions.handleClearAll
  }));

  return (
    <div className={`standalone-map-container ${theme} ${className}`} style={{ width: '100%', height: '100%' }}>
      <MapView
        position={mapState.position}
        zoom={initialZoom}
        markers={mapState.markers}
        tempMarker={mapState.tempMarker}
        markerName={mapState.markerName}
        markerType={mapState.markerType}
        onMapReady={handleMapReady}
        onLocationSelect={mapActions.handleLocationSelect}
        onMapClick={mapActions.handleMapClick}
        onDeleteMarker={mapActions.handleDeleteMarker}
        onSaveMarker={mapActions.handleSaveMarker}
        setMarkerName={mapActions.setMarkerName}
        setMarkerType={mapActions.setMarkerType}
        onShapeCreated={mapActions.handleShapeCreated}
        activeTool={mapState.activeTool}
        onRegionClick={handleDrawingClick}
        onClearAll={mapActions.handleClearAll}
        isMapReady={mapState.isMapReady}
        selectedLocation={mapState.selectedLocation}
        onClearSelectedLocation={() => {
          if (onLocationChange) {
            onLocationChange({ 
              latitude: mapState.position[0], 
              longitude: mapState.position[1] 
            });
          }
        }}
      />
      
      <AzureControls 
        userSession={userSession}
        onDataSync={onDataSync}
      />
    </div>
  );
});

StandaloneMapComponent.displayName = 'StandaloneMapComponent';

export default StandaloneMapComponent;
