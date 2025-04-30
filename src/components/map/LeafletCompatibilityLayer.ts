
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Ensure we have a valid featureGroup
  if (!featureGroup) {
    console.warn('EditControl: featureGroup is required');
    return null;
  }

  // Format the edit options properly - this is where the fix is needed
  const editOptions = {
    featureGroup: featureGroup,
    edit: {
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7,
        dashArray: '10, 10',
      }
    }
  };
  
  // Initialize edit capability on layers to prevent "disable" errors
  React.useEffect(() => {
    try {
      if (featureGroup && featureGroup.getLayers) {
        featureGroup.eachLayer((layer: any) => {
          // Ensure each layer has editing capability
          if (layer && !layer.editing) {
            // Initialize editing if missing
            layer.editing = {
              _enabled: false,
              enable: () => {
                if (layer._path) {
                  layer._path.classList.add('leaflet-edit-enabled');
                }
                layer.editing._enabled = true;
              },
              disable: () => {
                if (layer._path) {
                  layer._path.classList.remove('leaflet-edit-enabled');
                }
                layer.editing._enabled = false;
              }
            };
          }
        });
      }
    } catch (err) {
      console.error('Error initializing layer edit capabilities:', err);
    }
  }, [featureGroup]);

  // Return the original EditControl with proper prop structure
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions.edit,
    featureGroup: featureGroup,
    ref
  });
});

EditControl.displayName = "EditControl";
