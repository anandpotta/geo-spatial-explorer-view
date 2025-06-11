
import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { DrawingData } from '@/utils/drawing-utils';
import RemoveButton from '../RemoveButton';
import UploadButton from '../UploadButton';
import ImageControls from '../ImageControls';
import { getFloorPlanById } from '@/utils/floor-plan-utils';

export function addEditModeButtons(
  layer: L.Layer,
  drawing: DrawingData,
  featureGroup: L.FeatureGroup,
  isMounted: boolean,
  removeButtonRoots: Map<string, any>,
  uploadButtonRoots: Map<string, any>,
  imageControlRoots: Map<string, any>,
  onRemoveShape?: (drawingId: string) => void,
  onUploadRequest?: (drawingId: string) => void
): void {
  if (!layer || !isMounted) return;

  try {
    const bounds = (layer as any).getBounds();
    if (!bounds) return;

    const map = (featureGroup as any)._map;
    if (!map) return;

    const center = bounds.getCenter();
    const point = map.latLngToContainerPoint(center);
    const mapContainer = map.getContainer();

    // Create remove button
    createRemoveButton(mapContainer, point, drawing, removeButtonRoots, onRemoveShape);
    
    // Create upload button
    createUploadButton(mapContainer, point, drawing, uploadButtonRoots, onUploadRequest);
    
    // Create image controls if floor plan exists
    createImageControls(mapContainer, point, drawing, imageControlRoots);
  } catch (error) {
    console.error('Error adding edit mode buttons:', error);
  }
}

function createRemoveButton(
  mapContainer: HTMLElement,
  point: L.Point,
  drawing: DrawingData,
  removeButtonRoots: Map<string, any>,
  onRemoveShape?: (drawingId: string) => void
): void {
  const removeButtonContainer = document.createElement('div');
  removeButtonContainer.style.position = 'absolute';
  removeButtonContainer.style.left = `${point.x - 20}px`;
  removeButtonContainer.style.top = `${point.y - 30}px`;
  removeButtonContainer.style.zIndex = '1000';
  removeButtonContainer.style.pointerEvents = 'auto';

  mapContainer.appendChild(removeButtonContainer);

  const removeRoot = createRoot(removeButtonContainer);
  removeRoot.render(
    <RemoveButton 
      onClick={() => onRemoveShape && onRemoveShape(drawing.id)} 
    />
  );
  removeButtonRoots.set(`${drawing.id}-remove`, removeRoot);
}

function createUploadButton(
  mapContainer: HTMLElement,
  point: L.Point,
  drawing: DrawingData,
  uploadButtonRoots: Map<string, any>,
  onUploadRequest?: (drawingId: string) => void
): void {
  const uploadButtonContainer = document.createElement('div');
  uploadButtonContainer.style.position = 'absolute';
  uploadButtonContainer.style.left = `${point.x + 20}px`;
  uploadButtonContainer.style.top = `${point.y - 30}px`;
  uploadButtonContainer.style.zIndex = '1000';
  uploadButtonContainer.style.pointerEvents = 'auto';

  mapContainer.appendChild(uploadButtonContainer);

  const uploadRoot = createRoot(uploadButtonContainer);
  uploadRoot.render(
    <UploadButton 
      onClick={() => {
        console.log(`Upload button clicked for drawing: ${drawing.id}`);
        onUploadRequest && onUploadRequest(drawing.id);
      }} 
    />
  );
  uploadButtonRoots.set(`${drawing.id}-upload`, uploadRoot);
}

async function createImageControls(
  mapContainer: HTMLElement,
  point: L.Point,
  drawing: DrawingData,
  imageControlRoots: Map<string, any>
): Promise<void> {
  const floorPlan = await getFloorPlanById(drawing.id);
  if (floorPlan) {
    const imageControlsContainer = document.createElement('div');
    imageControlsContainer.style.position = 'absolute';
    imageControlsContainer.style.left = `${point.x}px`;
    imageControlsContainer.style.top = `${point.y + 20}px`;
    imageControlsContainer.style.zIndex = '1000';
    imageControlsContainer.style.pointerEvents = 'auto';

    mapContainer.appendChild(imageControlsContainer);

    const imageControlsRoot = createRoot(imageControlsContainer);
    imageControlsRoot.render(
      <ImageControls drawingId={drawing.id} />
    );
    imageControlRoots.set(`${drawing.id}-controls`, imageControlsRoot);
  }
}
