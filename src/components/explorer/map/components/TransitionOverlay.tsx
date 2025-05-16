
import React, { useEffect, useState } from 'react';

interface TransitionOverlayProps {
  isVisible: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ isVisible }) => {
  const [opacity, setOpacity] = useState(0);
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      // Show content immediately with overlay
      setShowContent(true);
      // Fade in quickly but not too drastically
      setOpacity(0.4);
      
      // Start fading out sooner for smoother transition
      const timeout = setTimeout(() => {
        setOpacity(0);
        // Hide content with slight delay after fade
        setTimeout(() => setShowContent(false), 400);
      }, 500);
      
      return () => clearTimeout(timeout);
    } else {
      setOpacity(0);
      // Delay hiding content until after fade out completes
      setTimeout(() => setShowContent(false), 400);
    }
  }, [isVisible]);
  
  // Don't render anything if not visible and fully transparent
  if (!isVisible && opacity === 0 && !showContent) return null;
  
  return (
    <div 
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
      style={{ 
        backgroundColor: `rgba(0,0,0,${opacity})`,
        transition: 'background-color 400ms ease-in-out'
      }}
    >
      {showContent && opacity > 0.05 && (
        <div className="text-white text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Transitioning view...</p>
        </div>
      )}
    </div>
  );
};

export default TransitionOverlay;
