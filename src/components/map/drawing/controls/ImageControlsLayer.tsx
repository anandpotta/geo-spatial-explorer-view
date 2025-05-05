
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import ImageControls from '../ImageControls';

interface ImageControlsLayerProps {
  drawingId: string;
  imageControlsPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  imageControlRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
  isPersistent?: boolean;
}

export const createImageControlsLayer = ({
  drawingId,
  imageControlsPosition,
  featureGroup,
  imageControlRoots,
  isMounted,
  onRemoveShape,
  isPersistent = false
}: ImageControlsLayerProps): void => {
  if (!imageControlsPosition) return;
  
  // Check if we already have a control for this drawing
  const existingControlId = `${drawingId}-image-controls`;
  const existingControl = imageControlRoots.has(existingControlId);
  
  // Don't recreate if already exists
  if (existingControl) return;
  
  const imageControlContainer = document.createElement('div');
  imageControlContainer.className = 'image-controls-wrapper';
  
  // Always add persistent-control class to ensure visibility
  imageControlContainer.classList.add('persistent-control');
  
  // Make sure styles are applied immediately
  imageControlContainer.style.opacity = '1';
  imageControlContainer.style.visibility = 'visible';
  imageControlContainer.style.display = 'block';
  
  const imageControlLayer = L.marker(imageControlsPosition, {
    icon: L.divIcon({
      className: 'image-controls-container',
      html: imageControlContainer,
      iconSize: [32, 120], // taller to accommodate multiple controls
      iconAnchor: [16, 60]
    }),
    interactive: true,
    zIndexOffset: 1000
  });
  
  // Always mark as persistent
  (imageControlLayer as any)._isPersistent = true;
  
  if (isMounted) {
    try {
      imageControlLayer.addTo(featureGroup);
      
      const imageControlRoot = createRoot(imageControlContainer);
      imageControlRoots.set(existingControlId, imageControlRoot);
      imageControlRoot.render(
        <ImageControls 
          drawingId={drawingId} 
          onRemoveShape={onRemoveShape} 
          alwaysExpanded={true} // Always show all controls
        />
      );
    } catch (err) {
      console.error('Error rendering image controls:', err);
    }
  }
};
