
import L from 'leaflet';
import { createRoot } from '../ReactDOMUtils';
import RemoveButton from '../RemoveButton';

/**
 * Creates and adds a remove button control to a layer
 */
export const createRemoveButtonControl = ({
  layer,
  drawingId,
  buttonPosition,
  featureGroup,
  removeButtonRoots,
  isMounted,
  onRemoveShape
}: {
  layer: L.Layer;
  drawingId: string;
  buttonPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
}) => {
  if (!isMounted) return null;
  
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

    return buttonLayer;
  } catch (err) {
    console.error('Error rendering remove button:', err);
    return null;
  }
};
