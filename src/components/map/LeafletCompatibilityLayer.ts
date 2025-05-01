
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
  if (edit === true) {
    // If edit is boolean true, create a proper object structure
    editOptions = {
      featureGroup: featureGroup
    };
  } else if (edit === false) {
    // If edit is boolean false, pass it as false
    editOptions = false;
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but don't overwrite featureGroup
    editOptions = {
      ...edit,
      featureGroup: featureGroup
    };
  } else {
    // Default case if edit is undefined or null
    editOptions = {
      featureGroup: featureGroup
    };
  }
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref: ref
  });
});

EditControl.displayName = "EditControl";
