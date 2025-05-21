
import L from 'leaflet';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import RemoveButton from '../RemoveButton';
import { useState } from 'react';
import ConfirmationDialog from '../ConfirmationDialog';

interface RemoveButtonControlProps {
  layer: L.Layer;
  drawingId: string;
  buttonPosition: L.LatLng;
  featureGroup: L.FeatureGroup;
  removeButtonRoots: Map<string, any>;
  isMounted: boolean;
  onRemoveShape: (drawingId: string) => void;
}

const RemoveButtonComponent = ({
  drawingId,
  onRemoveClick,
}: {
  drawingId: string;
  onRemoveClick: (drawingId: string) => void;
}) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmRemove = () => {
    setIsConfirmDialogOpen(false);
    onRemoveClick(drawingId);
  };
  
  const handleCancelRemove = () => {
    setIsConfirmDialogOpen(false);
  };
  
  return (
    <>
      <RemoveButton onClick={handleButtonClick} />
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        title="Remove Shape"
        description="Are you sure you want to remove this shape from the map? This action cannot be undone."
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
      />
    </>
  );
};

export const createRemoveButtonControl = ({
  layer,
  drawingId,
  buttonPosition,
  featureGroup,
  removeButtonRoots,
  isMounted,
  onRemoveShape
}: RemoveButtonControlProps): void => {
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
    try {
      buttonLayer.addTo(featureGroup);
      
      const root = createRoot(container);
      removeButtonRoots.set(drawingId, root);
      
      // Use the new RemoveButtonComponent with confirmation dialog
      root.render(
        <RemoveButtonComponent 
          drawingId={drawingId}
          onRemoveClick={onRemoveShape}
        />
      );
    } catch (err) {
      console.error('Error rendering remove button:', err);
    }
  }
};
