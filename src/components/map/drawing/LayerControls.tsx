
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import RemoveButton from './RemoveButton';
import UploadButton from './UploadButton';
import { toast } from 'sonner';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet';

interface LayerControlsProps {
  layer: L.Layer;
  drawingId: string;
  activeTool: string | null;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  uploadButtonRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
  onUploadRequest: (drawingId: string) => void;
}

export const createLayerControls = ({
  layer,
  drawingId,
  activeTool,
  featureGroup,
  removeButtonRoots,
  uploadButtonRoots,
  isMounted,
  onRemoveShape,
  onUploadRequest
}: LayerControlsProps) => {
  if (activeTool !== 'edit' || !isMounted) return;

  // Check if the map is valid
  try {
    const map = getMapFromLayer(featureGroup);
    if (!isMapValid(map)) {
      console.warn("Map container is not valid, skipping layer controls");
      return;
    }
  } catch (err) {
    console.error('Error validating map for layer controls:', err);
    return;
  }

  let buttonPosition;
  let uploadButtonPosition;
  
  try {
    if ('getLatLng' in layer) {
      // For markers
      buttonPosition = (layer as L.Marker).getLatLng();
      uploadButtonPosition = L.latLng(
        buttonPosition.lat + 0.00005, // Position closer to the path
        buttonPosition.lng + 0.00005
      );
    } else if ('getBounds' in layer) {
      // For polygons, rectangles, etc.
      const bounds = (layer as any).getBounds();
      if (bounds) {
        buttonPosition = bounds.getNorthEast();
        uploadButtonPosition = L.latLng(
          bounds.getNorthEast().lat,
          bounds.getNorthEast().lng - 0.00005 // Position closer to the path
        );
      }
    } else if ('getLatLngs' in layer) {
      // For polylines or complex shapes
      const latlngs = (layer as any).getLatLngs();
      if (latlngs && latlngs.length > 0) {
        buttonPosition = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
        uploadButtonPosition = L.latLng(
          buttonPosition.lat + 0.00005, // Position closer to the path
          buttonPosition.lng + 0.00005
        );
      }
    }
  } catch (err) {
    console.error('Error determining button positions:', err);
    return;
  }
  
  if (!buttonPosition) return;
  
  // Create remove button
  const container = document.createElement('div');
  container.className = 'remove-button-wrapper';
  
  const buttonLayer = L.marker(buttonPosition, {
    icon: L.divIcon({
      className: 'remove-button-container',
      html: container,
      iconSize: [20, 20], // Set to 20px x 20px
      iconAnchor: [10, 10]  // Adjusted anchor to center of the icon
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
        <RemoveButton 
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemoveShape(drawingId);
            toast.success('Shape removed');
          }} 
          className="animate-pulse"
        />
      );
    } catch (err) {
      console.error('Error rendering remove button:', err);
    }
  }
  
  // Create upload button
  if (uploadButtonPosition) {
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'upload-button-wrapper';
    
    const uploadButtonLayer = L.marker(uploadButtonPosition, {
      icon: L.divIcon({
        className: 'upload-button-container',
        html: uploadContainer,
        iconSize: [20, 20], // Set to 20px x 20px
        iconAnchor: [10, 10] // Adjusted anchor to center of the icon
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
  }
};
