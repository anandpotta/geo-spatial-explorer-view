
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import UploadButton from '../UploadButton';
import { toast } from 'sonner';

interface UploadButtonControlProps {
  drawingId: string;
  uploadButtonPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  uploadButtonRoots: Map<string, any>;
  isMounted: boolean;
  onUploadRequest: (drawingId: string) => void;
}

export const createUploadButtonControl = ({
  drawingId,
  uploadButtonPosition,
  featureGroup,
  uploadButtonRoots,
  isMounted,
  onUploadRequest
}: UploadButtonControlProps): void => {
  if (!uploadButtonPosition) return;
  
  const uploadContainer = document.createElement('div');
  uploadContainer.className = 'upload-button-wrapper';
  
  const uploadButtonLayer = L.marker(uploadButtonPosition, {
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
