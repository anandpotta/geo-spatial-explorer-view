
import React from 'react';

interface TransitionOverlayProps {
  show: boolean;
}

const TransitionOverlay: React.FC<TransitionOverlayProps> = ({ show }) => {
  if (!show) return null;
  
  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-30 z-20 pointer-events-none animate-fade-in"
      style={{
        animation: 'fadeInOut 500ms ease-in-out forwards'
      }}
    >
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TransitionOverlay;
