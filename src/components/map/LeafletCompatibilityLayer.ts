
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = React.forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Prepare edit options properly
  const editOptions = edit ? {
    ...edit,
    featureGroup: featureGroup
  } : edit;
  
  // Return the original EditControl with proper prop structure
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref
  });
});

EditControl.displayName = "EditControl";
