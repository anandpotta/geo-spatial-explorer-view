
import React from 'react';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
}

const DrawingEffects: React.FC<DrawingEffectsProps> = ({ 
  activeTool, 
  isInitialized 
}) => {
  return (
    <>
      {/* Add any global effects or styling that are conditional based on activeTool or initialization state */}
      {isInitialized && (
        <style>
          {`
          .leaflet-draw-tooltip {
            visibility: ${activeTool ? 'visible' : 'hidden'} !important;
          }
          .leaflet-draw-draw-polyline,
          .leaflet-draw-draw-circlemarker,
          .leaflet-draw-edit-edit,
          .leaflet-draw-edit-remove {
            display: none !important;
          }
          .visible-path-stroke {
            stroke: #33C3F0 !important;
            stroke-width: 4px !important;
            stroke-opacity: 1 !important;
            vector-effect: non-scaling-stroke !important;
          }
          .leaflet-pane path.leaflet-interactive,
          .leaflet-overlay-pane path.leaflet-interactive {
            stroke: #33C3F0 !important;
            stroke-width: 4px !important;
            stroke-opacity: 1 !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
            vector-effect: non-scaling-stroke !important;
          }
          `}
        </style>
      )}
    </>
  );
};

export default DrawingEffects;
