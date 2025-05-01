
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import RemoveButton from '../RemoveButton';

interface RemoveButtonControlProps {
  layer: L.Layer;
  drawingId: string;
  buttonPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
}

export const createRemoveButtonControl = ({
  layer,
  drawingId,
  buttonPosition,
  featureGroup,
  removeButtonRoots,
  isMounted,
  onRemoveShape
}: RemoveButtonControlProps): void => {
  if (!buttonPosition) return;
  
  // Create remove button
  const container = document.createElement('div');
  container.className = 'remove-button-wrapper';
  
  const buttonLayer = L.marker(buttonPosition, {
    icon: L.divIcon({
      className: 'remove-button-container',
      html: container,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    }),
    interactive: true,
    zIndexOffset: 1000
  });
  
  if (isMounted) {
    try {
      buttonLayer.addTo(featureGroup);
      
      const root = createRoot(container);
      removeButtonRoots.set(drawingId, root);
      
      root.render(
        <RemoveButton onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onRemoveShape(drawingId);
        }} />
      );
    } catch (err) {
      console.error('Error rendering remove button:', err);
    }
  }
};
