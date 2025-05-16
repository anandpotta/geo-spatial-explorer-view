
import React from 'react';

interface MapLoadingIndicatorProps {
  loading: boolean;
  preload?: boolean;
}

const MapLoadingIndicator: React.FC<MapLoadingIndicatorProps> = ({ loading, preload }) => {
  if (loading && !preload) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <h3 className="text-lg font-medium">Loading Map</h3>
        </div>
      </div>
    );
  }
  
  return null;
};

export default MapLoadingIndicator;
