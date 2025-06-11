
import L from 'leaflet';
import { DrawingData } from '@/utils/drawing-utils';

export function setupLayerClickHandler(
  layer: L.Layer,
  drawing: DrawingData,
  onUploadRequest?: (drawingId: string) => void,
  onRegionClick?: (drawing: DrawingData) => void
): void {
  layer.on('click', (e: L.LeafletMouseEvent) => {
    console.log(`Layer clicked for drawing: ${drawing.id} - triggering upload request`);
    
    // Stop event propagation to prevent map click
    L.DomEvent.stopPropagation(e);
    
    // Trigger upload request FIRST - this is the primary action
    if (onUploadRequest) {
      console.log(`Calling onUploadRequest for drawing: ${drawing.id}`);
      onUploadRequest(drawing.id);
    }
    
    // Then call region click as secondary action
    if (onRegionClick) {
      console.log(`Calling onRegionClick for drawing: ${drawing.id}`);
      onRegionClick(drawing);
    }
  });
}
