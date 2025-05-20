
import { useCallback } from 'react';
import { zoomIn, zoomOut, resetCamera } from '@/utils/threejs-camera';
import { isMapValid } from '@/utils/leaflet-type-utils';

export function useMapNavigation(currentView: 'cesium' | 'leaflet', cesiumViewerRef: React.MutableRefObject<any>, leafletMapRef: React.MutableRefObject<any>) {
  const handleZoomIn = useCallback(() => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomIn(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() + 1);
      } catch (err) {
        console.error('Error zooming in on leaflet map:', err);
      }
    }
  }, [currentView, cesiumViewerRef, leafletMapRef]);

  const handleZoomOut = useCallback(() => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomOut(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() - 1);
      } catch (err) {
        console.error('Error zooming out on leaflet map:', err);
      }
    }
  }, [currentView, cesiumViewerRef, leafletMapRef]);

  const handleResetView = useCallback(() => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      resetCamera(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setView([0, 0], 2);
      } catch (err) {
        console.error('Error resetting leaflet map view:', err);
      }
    }
  }, [currentView, cesiumViewerRef, leafletMapRef]);
  
  const handleClearAll = useCallback(() => {
    if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        const layers = leafletMapRef.current._layers;
        if (layers) {
          Object.keys(layers).forEach(layerId => {
            const layer = layers[layerId];
            if (layer && layer.options && (layer.options.isDrawn || layer.options.id)) {
              leafletMapRef.current.removeLayer(layer);
            }
          });
        }
      } catch (err) {
        console.error('Error during clear all operation:', err);
      }
    }
  }, [currentView, leafletMapRef]);

  return {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleClearAll
  };
}
