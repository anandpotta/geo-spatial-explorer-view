
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import UploadButton from '../UploadButton';
import { toast } from 'sonner';

interface UploadButtonControlProps {
  drawingId: string;
  featureGroup: L.FeatureGroup;
  uploadButtonRoots: Map<string, any>;
  isMounted: boolean;
  onUploadRequest: (drawingId: string) => void;
  uploadButtonPosition?: L.LatLng;
  layer?: L.Layer;
}

export const createUploadButtonControl = ({
  drawingId,
  featureGroup,
  uploadButtonRoots,
  isMounted,
  onUploadRequest,
  uploadButtonPosition,
  layer
}: UploadButtonControlProps): void => {
  // Use provided position or try to get from layer if available
  const position = uploadButtonPosition || (layer && (layer as any).getLatLng?.());
  
  if (!position) return;
  
  const uploadContainer = document.createElement('div');
  uploadContainer.className = 'upload-button-wrapper';
  
  const uploadButtonLayer = L.marker(position, {
    icon: L.divIcon({
      className: 'upload-button-container',
      html: uploadContainer,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }),
    interactive: true,
    zIndexOffset: 1000
  });
  
  if (isMounted) {
    try {
      uploadButtonLayer.addTo(featureGroup);
      
      const uploadRoot = createRoot(uploadContainer);
      uploadButtonRoots.set(`${drawingId}-upload`, uploadRoot);
      uploadRoot.render(
        <UploadButton 
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            try {
              onUploadRequest(drawingId);
            } catch (err) {
              console.error('Error in upload request:', err);
              toast.error('Could not initiate upload. Please try again.');
            }
          }} 
        />
      );
    } catch (err) {
      console.error('Error rendering upload button:', err);
    }
  }
};
