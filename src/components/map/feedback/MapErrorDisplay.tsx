
import React from 'react';

interface MapErrorDisplayProps {
  error: string | null;
}

const MapErrorDisplay: React.FC<MapErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Map Error</h3>
        <p className="text-gray-700">{error}</p>
      </div>
    </div>
  );
};

export default MapErrorDisplay;
