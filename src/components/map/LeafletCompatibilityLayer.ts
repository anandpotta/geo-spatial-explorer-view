
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Format the edit options properly - this is where the fix is needed
  let editOptions;
  
  // Handle different types of edit parameters
  if (typeof edit === 'boolean') {
    // If edit is a boolean, create a proper object structure
    editOptions = {
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      }
    };
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but ensure consistent structure
    editOptions = {
      ...edit,
      featureGroup: featureGroup,
      edit: {
        ...(edit.edit || {}),
        selectedPathOptions: {
          ...(edit.edit?.selectedPathOptions || {}),
          maintainColor: true,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      }
    };
  } else {
    // Default case if edit is undefined or null
    editOptions = {
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      }
    };
  }
  
  // Return the original EditControl with proper prop structure
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions.edit,
    featureGroup: featureGroup,
    ref
  });
});

EditControl.displayName = "EditControl";
