
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
}

export const createImageControlsLayer = ({
  drawingId,
  imageControlsPosition,
  featureGroup,
  imageControlRoots,
  isMounted,
  onRemoveShape
}: ImageControlsLayerProps): void => {
  if (!imageControlsPosition) return;
  
  const imageControlContainer = document.createElement('div');
  imageControlContainer.className = 'image-controls-wrapper';
  
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
  
  if (isMounted) {
    try {
      imageControlLayer.addTo(featureGroup);
      
      const imageControlRoot = createRoot(imageControlContainer);
      imageControlRoots.set(`${drawingId}-image-controls`, imageControlRoot);
      imageControlRoot.render(
        <ImageControls 
          drawingId={drawingId} 
          onRemoveShape={onRemoveShape} 
        />
      );
    } catch (err) {
      console.error('Error rendering image controls:', err);
    }
  }
};
