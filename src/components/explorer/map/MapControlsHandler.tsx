
import React from 'react';
import { zoomIn, zoomOut, resetCamera } from '@/utils/threejs-camera';
import { toast } from '@/components/ui/use-toast';
import { isMapValid } from '@/utils/leaflet-type-utils';

interface MapControlsHandlerProps {
  currentView: 'cesium' | 'leaflet';
  cesiumViewerRef: React.MutableRefObject<any>;
  leafletMapRef: React.MutableRefObject<any>;
}

const MapControlsHandler: React.FC<MapControlsHandlerProps> = ({ 
  currentView, 
  cesiumViewerRef, 
  leafletMapRef 
}) => {
  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      zoomIn(cesiumViewerRef.current);
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() + 1);
        } else {
          console.error('Error zooming in on leaflet map: map is not valid');
        }
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
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.setZoom(leafletMapRef.current.getZoom() - 1);
        } else {
          console.error('Error zooming out on leaflet map: map is not valid');
        }
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
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.setView([0, 0], 2);
          toast.success("View reset");
        } else {
          console.error('Error resetting leaflet map view: map is not valid');
        }
      } catch (err) {
        console.error('Error resetting leaflet map view:', err);
      }
    }
  };

  const handleClearAll = () => {
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
  };

  return {
    handleZoomIn,
    handleZoomOut,
    handleResetView,
    handleClearAll
  };
};

export default MapControlsHandler;
