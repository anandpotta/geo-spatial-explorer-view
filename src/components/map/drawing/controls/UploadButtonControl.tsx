
import L from 'leaflet';
import { createRoot } from '../ReactDOMUtils';
import UploadButton from '../UploadButton';
import { toast } from 'sonner';

/**
 * Creates and adds an upload button control to a layer
 */
export const createUploadButtonControl = ({
  layer,
  drawingId,
  uploadButtonPosition,
  featureGroup,
  uploadButtonRoots,
  isMounted,
  onUploadRequest
}: {
  layer: L.Layer;
  drawingId: string;
  uploadButtonPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  uploadButtonRoots: Map<string, any>;
  isMounted: boolean;
  onUploadRequest: (drawingId: string) => void;
}) => {
  if (!isMounted) return null;
  
  // Create upload button
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

    return uploadButtonLayer;
  } catch (err) {
    console.error('Error rendering upload button:', err);
    return null;
  }
};
