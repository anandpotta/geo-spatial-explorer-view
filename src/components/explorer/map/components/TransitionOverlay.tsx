
import React from 'react';

interface TransitionOverlayProps {
  show: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-30 z-20 pointer-events-none transition-opacity duration-300"
      style={{
        animation: 'fadeInOut 500ms ease-in-out forwards'
      }}
    />
  );
};

export default TransitionOverlay;
