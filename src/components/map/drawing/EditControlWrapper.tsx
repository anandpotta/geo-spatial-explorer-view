
import { forwardRef, useImperativeHandle } from 'react';
import { FeatureGroup, useLeafletContext } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

interface EditControlProps {
  position: 'topright' | 'topleft' | 'bottomright' | 'bottomleft';
  onCreated: (e: any) => void;
  draw: {
    rectangle?: boolean;
    polygon?: boolean;
    circle?: boolean;
    circlemarker?: boolean;
    marker?: boolean;
    polyline?: boolean;
  };
}

const EditControlWrapper = forwardRef<any, EditControlProps>((props, ref) => {
  // This is the correct way to ensure the ref is properly passed through
  return (
    <EditControl ref={ref} {...props} />
  );
});

EditControlWrapper.displayName = 'EditControlWrapper';

export default EditControlWrapper;
