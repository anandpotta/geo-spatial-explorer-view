
import React from 'react';
import { EditControl } from 'react-leaflet-draw';
import { forwardRefWrapper } from '@/utils/forward-ref-wrapper';

// Create a wrapped version of the EditControl component that can accept refs
const ForwardedEditControl = forwardRefWrapper(EditControl);

interface DrawToolsWrapperProps {
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  draw?: any;
  edit?: any;
}

/**
 * Wrapper component for the EditControl to resolve ref warnings
 */
const DrawToolsWrapper: React.FC<DrawToolsWrapperProps> = ({
  position,
  onCreated,
  onEdited,
  onDeleted,
  draw,
  edit,
}) => {
  return (
    <div className="leaflet-draw-container">
      <ForwardedEditControl
        position={position}
        onCreated={onCreated}
        onEdited={onEdited}
        onDeleted={onDeleted}
        draw={draw}
        edit={edit}
      />
    </div>
  );
};

export default DrawToolsWrapper;
