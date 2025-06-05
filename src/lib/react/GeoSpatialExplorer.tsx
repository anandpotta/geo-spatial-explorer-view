
import React from 'react';
import { GeoSpatialExplorerProps } from '../core/types';

export const GeoSpatialExplorer: React.FC<GeoSpatialExplorerProps> = ({
  selectedLocation,
  onLocationSelect,
  onMapReady,
  currentView = 'leaflet',
  mapOptions
}) => {
  React.useEffect(() => {
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  const handleLocationClick = () => {
    if (onLocationSelect) {
      onLocationSelect({
        id: '1',
        x: -74.0060,
        y: 40.7128,
        label: 'New York City'
      });
    }
  };

  return (
    <div style={{ width: '100%', height: '400px', border: '1px solid #ccc' }}>
      <div style={{ padding: '10px' }}>
        <h3>GeoSpatial Explorer ({currentView})</h3>
        {selectedLocation && (
          <p>
            Selected: {selectedLocation.label} ({selectedLocation.x}, {selectedLocation.y})
          </p>
        )}
        <button onClick={handleLocationClick}>
          Select Sample Location
        </button>
        <div style={{ 
          marginTop: '10px', 
          height: '300px', 
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Map View Placeholder - {currentView.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
