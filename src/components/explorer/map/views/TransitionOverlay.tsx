
import React from 'react';

interface TransitionOverlayProps {
  isVisible: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-20 z-20 pointer-events-none"
      style={{
        animation: 'fadeInOut 800ms ease-in-out forwards'
      }}
    />
  );
};

export default TransitionOverlay;
