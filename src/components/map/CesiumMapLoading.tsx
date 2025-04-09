
import React from 'react';

interface CesiumMapLoadingProps {
  isLoading: boolean;
  mapError: string | null;
}

const CesiumMapLoading = ({ isLoading, mapError }: CesiumMapLoadingProps) => {
  // If there's an error loading the map, display an error message
  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Cesium Map Error</h3>
          <p>{mapError}</p>
          <p className="text-sm mt-4">Falling back to 2D map view...</p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-center p-4">
          <h3 className="text-xl font-bold mb-2">Loading 3D Globe</h3>
          <p>Please wait while we initialize the map...</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default CesiumMapLoading;
