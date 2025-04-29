
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import RemoveButton from './RemoveButton';
import UploadButton from './UploadButton';

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

  let buttonPosition;
  let uploadButtonPosition;
  
  if ('getLatLng' in layer) {
    // For markers
    buttonPosition = (layer as L.Marker).getLatLng();
    uploadButtonPosition = L.latLng(
      buttonPosition.lat + 0.0001,
      buttonPosition.lng
    );
  } else if ('getBounds' in layer) {
    // For polygons, rectangles, etc.
    const bounds = (layer as any).getBounds();
    if (bounds) {
      buttonPosition = bounds.getNorthEast();
      uploadButtonPosition = L.latLng(
        bounds.getNorthEast().lat,
        bounds.getNorthEast().lng - 0.0002
      );
    }
  } else if ('getLatLngs' in layer) {
    // For polylines or complex shapes
    const latlngs = (layer as any).getLatLngs();
    if (latlngs && latlngs.length > 0) {
      buttonPosition = Array.isArray(latlngs[0]) ? latlngs[0][0] : latlngs[0];
      uploadButtonPosition = L.latLng(
        buttonPosition.lat + 0.0001,
        buttonPosition.lng
      );
    }
  }
  
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
    buttonLayer.addTo(featureGroup);
    
    try {
      const root = createRoot(container);
      removeButtonRoots.set(drawingId, root);
      root.render(
        <RemoveButton onClick={() => onRemoveShape(drawingId)} />
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
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }),
      interactive: true,
      zIndexOffset: 1000
    });
    
    if (isMounted) {
      uploadButtonLayer.addTo(featureGroup);
      
      try {
        const uploadRoot = createRoot(uploadContainer);
        uploadButtonRoots.set(`${drawingId}-upload`, uploadRoot);
        uploadRoot.render(
          <UploadButton onClick={() => onUploadRequest(drawingId)} />
        );
      } catch (err) {
        console.error('Error rendering upload button:', err);
      }
    }
  }
};
