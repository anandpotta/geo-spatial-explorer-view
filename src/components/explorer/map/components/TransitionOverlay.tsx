
import React from 'react';

interface TransitionOverlayProps {
  isVisible: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-30 z-50 pointer-events-none transition-opacity duration-500"
      style={{
        opacity: 0.3,
      }}
    />
  );
};

export default TransitionOverlay;
