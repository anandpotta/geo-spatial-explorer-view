
import React from 'react';

type LoadingStatus = 'loading' | 'partial' | 'complete';

interface GlobeLoadingIndicatorProps {
  status: LoadingStatus;
}

/**
 * Display loading indicator for the globe with appropriate messaging
 */
const GlobeLoadingIndicator: React.FC<GlobeLoadingIndicatorProps> = ({ status }) => {
  if (status === 'complete') return null;
  
  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10 transition-opacity duration-500 ${status === 'partial' ? 'opacity-70' : 'opacity-100'}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-white text-lg">
          {status === 'loading' ? 'Initializing Globe...' : 'Loading Earth Textures...'}
        </div>
        <div className="text-gray-400 text-xs mt-2">
          {status === 'partial' ? 'Almost ready...' : 'Please wait...'}
        </div>
      </div>
    </div>
  );
};

export default GlobeLoadingIndicator;
