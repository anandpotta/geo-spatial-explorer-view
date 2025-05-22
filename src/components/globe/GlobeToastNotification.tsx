
import React from 'react';

interface GlobeToastNotificationProps {
  locationLabel?: string;
}

export const GlobeToastNotification: React.FC<GlobeToastNotificationProps> = ({ locationLabel }) => {
  if (!locationLabel) return null;
  
  return (
    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-md animate-pulse">
      <span className="text-sm">Navigating to {locationLabel}...</span>
    </div>
  );
};
