
import L from 'leaflet';
import { createRoot } from './ReactDOMUtils';
import ImageRotationControls from './ImageRotationControls';
import { toast } from 'sonner';

/**
 * Add rotation controls for images
 */
export const addRotationControls = ({
  layer,
  drawingId,
  featureGroup,
  rotationControlRoots,
  isMounted,
  onRotateImage
}: {
  layer: L.Layer;
  drawingId: string;
  featureGroup: L.FeatureGroup;
  rotationControlRoots: Map<string, any>;
  isMounted: boolean;
  onRotateImage: (drawingId: string, degrees: number) => void;
}) => {
  if (!isMounted) return;
  
  try {
    // Determine position for controls
    let position;
    
    if ('getLatLng' in layer) {
      // For markers
      position = (layer as L.Marker).getLatLng();
    } else if ('getBounds' in layer) {
      // For polygons, rectangles, etc.
      const bounds = (layer as any).getBounds();
      if (bounds) {
        // Position at the south center
        const southWest = bounds.getSouthWest();
        const southEast = bounds.getSouthEast();
        position = L.latLng(
          southWest.lat,
          southWest.lng + (southEast.lng - southWest.lng) / 2
        );
      }
    } else if ('getLatLngs' in layer) {
      // For polylines or complex shapes
      const latlngs = (layer as any).getLatLngs();
      if (latlngs && latlngs.length > 0) {
        position = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
      }
    }
    
    if (!position) return;
    
    // Create container for rotation controls
    const container = document.createElement('div');
    container.className = 'rotation-controls-wrapper';
    
    // Create marker for rotation controls
    const controlsLayer = L.marker(position, {
      icon: L.divIcon({
        className: 'rotation-controls-container',
        html: container,
        iconSize: [80, 30],
        iconAnchor: [40, -10] // Position above the shape
      }),
      interactive: true,
      zIndexOffset: 1000
    });
    
    try {
      controlsLayer.addTo(featureGroup);
      
      const root = createRoot(container);
      rotationControlRoots.set(drawingId, root);
      
      root.render(
        <ImageRotationControls
          onRotateLeft={() => onRotateImage(drawingId, -90)}
          onRotateRight={() => onRotateImage(drawingId, 90)}
        />
      );
    } catch (err) {
      console.error('Error rendering rotation controls:', err);
    }
  } catch (err) {
    console.error('Error adding rotation controls:', err);
  }
};
