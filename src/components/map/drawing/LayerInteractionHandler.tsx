
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing/types';

/**
 * Sets up click handlers for a layer
 */
export const setupLayerClickHandler = ({
  layer,
  drawing,
  isMounted,
  onRegionClick
}: {
  layer: L.Layer;
  drawing: DrawingData;
  isMounted: boolean;
  onRegionClick?: (drawing: DrawingData) => void;
}) => {
  if (!onRegionClick || !isMounted) return;
  
  layer.on('click', (e) => {
    // Stop event propagation to prevent map click
    if (e.originalEvent) {
      L.DomEvent.stopPropagation(e.originalEvent);
    }
    
    if (isMounted) {
      onRegionClick(drawing);
    }
  });
};
