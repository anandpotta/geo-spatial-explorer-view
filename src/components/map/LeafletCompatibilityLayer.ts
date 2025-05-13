
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Format the edit options properly based on what was passed
  let editOptions = {
    featureGroup: featureGroup
  };
  
  // Handle different types of edit parameters
  if (edit === true) {
    // If edit is boolean true, create a proper object structure
    editOptions = { 
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7,
          dashArray: '10, 10',
          fill: true,
          fillColor: '#ffffff',
          fillOpacity: 0.1
        }
      },
      remove: true
    };
  } else if (edit === false) {
    // If edit is boolean false, disable edit mode
    editOptions = {
      featureGroup: featureGroup,
      edit: false,
      remove: false
    };
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but preserve structure
    editOptions = {
      featureGroup: featureGroup,
      edit: {
        ...edit,
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7,
          dashArray: '10, 10',
          fill: true,
          fillColor: '#ffffff',
          fillOpacity: 0.1,
          ...(edit.selectedPathOptions || {})
        }
      },
      remove: edit.remove !== undefined ? edit.remove : true
    };
  }
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions.edit,
    remove: editOptions.remove,
    featureGroup: featureGroup,
    ref: ref
  });
});

EditControl.displayName = "EditControl";
