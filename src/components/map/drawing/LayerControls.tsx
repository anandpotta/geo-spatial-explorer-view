
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
  let mapInstance: L.Map | null = null;
  try {
    mapInstance = getMapFromLayer(featureGroup);
    if (!isMapValid(mapInstance)) {
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
      // Position the upload button slightly to the right of the marker
      uploadButtonPosition = L.latLng(
        buttonPosition.lat,
        buttonPosition.lng + 0.0002 // Increase the spacing to avoid overlap
      );
    } else if ('getBounds' in layer) {
      // For polygons, rectangles, etc.
      const bounds = (layer as any).getBounds();
      if (bounds) {
        // Position remove button at the northeast corner
        buttonPosition = bounds.getNorthEast();
        
        // Position upload button at the northwest corner to create clear separation
        uploadButtonPosition = L.latLng(
          bounds.getNorthWest().lat,
          bounds.getNorthWest().lng
        );
      }
    } else if ('getLatLngs' in layer) {
      // For polylines or complex shapes
      const latlngs = (layer as any).getLatLngs();
      if (latlngs && latlngs.length > 0) {
        // For the remove button, use the first point
        buttonPosition = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
        
        // For the upload button, use the last point to ensure separation
        const lastPoints = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        const lastPoint = lastPoints[lastPoints.length - 1];
        uploadButtonPosition = L.latLng(lastPoint.lat, lastPoint.lng);
        
        // If they happen to be too close, adjust position
        if (uploadButtonPosition && buttonPosition) {
          const distance = mapInstance.distance(
            [buttonPosition.lat, buttonPosition.lng],
            [uploadButtonPosition.lat, uploadButtonPosition.lng]
          );
          
          if (distance < 10) { // If less than 10 meters apart
            uploadButtonPosition = L.latLng(
              buttonPosition.lat - 0.0002,
              buttonPosition.lng
            );
          }
        }
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
      iconSize: [20, 20],
      iconAnchor: [10, 10]
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
        iconSize: [20, 20],
        iconAnchor: [10, 10]
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
