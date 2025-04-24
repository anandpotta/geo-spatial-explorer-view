
import React from 'react';
import { EditControl } from 'react-leaflet-draw';
import { forwardRefWrapper } from '@/utils/forward-ref-wrapper';

interface DrawToolsWrapperProps {
  position: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  onCreated?: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  draw?: any;
  edit?: any;
}

// Create a wrapped version of the EditControl component that can accept refs
const ForwardedEditControl = forwardRefWrapper(EditControl);

/**
 * Wrapper component for the EditControl to resolve ref warnings
 */
const DrawToolsWrapper = React.forwardRef<any, DrawToolsWrapperProps>(
  (props, ref) => {
    return (
      <div className="leaflet-draw-container">
        <ForwardedEditControl
          ref={ref}
          position={props.position}
          onCreated={props.onCreated}
          onEdited={props.onEdited}
          onDeleted={props.onDeleted}
          draw={props.draw}
          edit={props.edit}
        />
      </div>
    );
  }
);

DrawToolsWrapper.displayName = 'DrawToolsWrapper';

export default DrawToolsWrapper;
