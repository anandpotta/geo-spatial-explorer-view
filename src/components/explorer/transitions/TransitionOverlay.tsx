
import React from 'react';

interface TransitionOverlayProps {
  isTransitioning: boolean;
}

const TransitionOverlay = ({ isTransitioning }: TransitionOverlayProps) => {
  if (!isTransitioning) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-[10002] pointer-events-none">
      <div className="bg-background/70 rounded-lg p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-lg font-semibold text-primary">Traveling to destination...</p>
        </div>
      </div>
    </div>
  );
};

export default TransitionOverlay;
