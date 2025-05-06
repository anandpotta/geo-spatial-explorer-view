
import React from 'react';
import { isMapValid } from '@/utils/leaflet-type-utils';
import { toast } from 'sonner';

interface MapToolsProps {
  currentView: 'cesium' | 'leaflet';
  cesiumViewerRef: React.MutableRefObject<any>;
  leafletMapRef: React.MutableRefObject<any>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const MapTools: React.FC<MapToolsProps> = ({
  currentView,
  cesiumViewerRef,
  leafletMapRef,
  onZoomIn,
  onZoomOut,
  onResetView
}) => {
  const handleZoomIn = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      onZoomIn();
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.zoomIn();
        } else {
          console.warn('Leaflet map instance is not valid for zoom in operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during zoom in operation:', err);
        toast.error('Failed to zoom in. Please try again.');
      }
    }
  };

  const handleZoomOut = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      onZoomOut();
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.zoomOut();
        } else {
          console.warn('Leaflet map instance is not valid for zoom out operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during zoom out operation:', err);
        toast.error('Failed to zoom out. Please try again.');
      }
    }
  };

  const handleResetView = () => {
    if (currentView === 'cesium' && cesiumViewerRef.current) {
      onResetView();
      toast.info('View reset');
    } else if (currentView === 'leaflet' && leafletMapRef.current) {
      try {
        // Validate the map instance before using it
        if (isMapValid(leafletMapRef.current)) {
          leafletMapRef.current.setView([51.505, -0.09], 13);
          toast.info('View reset');
        } else {
          console.warn('Leaflet map instance is not valid for reset operation');
          toast.error('Map control error. Please try again.');
        }
      } catch (err) {
        console.error('Error during reset operation:', err);
        toast.error('Failed to reset view. Please try again.');
      }
    }
  };

  return (
    <div className="map-tools">
      <button onClick={handleZoomIn}>Zoom In</button>
      <button onClick={handleZoomOut}>Zoom Out</button>
      <button onClick={handleResetView}>Reset View</button>
    </div>
  );
};

export default MapTools;
