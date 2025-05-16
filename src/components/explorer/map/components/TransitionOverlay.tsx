
import React, { useEffect, useState } from 'react';

interface TransitionOverlayProps {
  isVisible: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible }) => {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    if (isVisible) {
      // Fade in quickly
      setOpacity(0.6);
      
      // Start fading out after a short delay
      const timeout = setTimeout(() => {
        setOpacity(0);
      }, 800);
      
      return () => clearTimeout(timeout);
    } else {
      setOpacity(0);
    }
  }, [isVisible]);
  
  if (!isVisible && opacity === 0) return null;
  
  return (
    <div 
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
      style={{ 
        backgroundColor: `rgba(0,0,0,${opacity})`,
        transition: 'background-color 600ms ease-in-out'
      }}
    >
      {opacity > 0.1 && (
        <div className="text-white text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Transitioning view...</p>
        </div>
      )}
    </div>
  );
};

export default TransitionOverlay;
