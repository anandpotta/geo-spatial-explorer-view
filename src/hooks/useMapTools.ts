
import { MutableRefObject } from 'react';
import { zoomIn, zoomOut, resetCamera } from '@/utils/threejs-camera';
import { LeafletMapInternal } from '@/utils/leaflet-type-utils';

/**
 * Custom hook to handle map tool actions
 */
export function useMapTools(
  currentView: 'cesium' | 'leaflet', 
  cesiumViewerRef: MutableRefObject<any>, 
  leafletMapRef: MutableRefObject<LeafletMapInternal>
) {
  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomIn(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() + 1);
      } catch (err) {
        console.error('Error zooming in on leaflet map:', err);
      }
    }
  };

  const handleZoomOut = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomOut(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() - 1);
      } catch (err) {
        console.error('Error zooming out on leaflet map:', err);
      }
    }
  };

  const handleResetView = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      resetCamera(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        leafletMapRef.current.setView([0, 0], 2);
      } catch (err) {
        console.error('Error resetting leaflet map view:', err);
      }
    }
  };

  return {
    handleZoomIn,
    handleZoomOut,
    handleResetView
  };
}
