
import React from 'react';

interface DrawingControlsEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
}

const DrawingControlsEffects: React.FC<DrawingControlsEffectsProps> = ({ 
  activeTool, 
  isInitialized 
}) => {
  return (
    <>
      {/* Add any global effects or styling that are conditional based on activeTool or initialization state */}
      {isInitialized && (
        <style jsx global>{`
          .leaflet-draw-tooltip {
            visibility: ${activeTool ? 'visible' : 'hidden'} !important;
          }
          .leaflet-draw-draw-polyline,
          .leaflet-draw-draw-circlemarker,
          .leaflet-draw-edit-edit,
          .leaflet-draw-edit-remove {
            display: none !important;
          }
        `}</style>
      )}
    </>
  );
};

export default DrawingControlsEffects;
