
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = React.forwardRef((props: any, ref: any) => {
  // The EditControl expects to find the featureGroup through context
  // but we're passing it manually, so we need to extract it
  const { featureGroup, ...otherProps } = props;
  
  // Return the original EditControl without the featureGroup prop
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    ref
  });
});

EditControl.displayName = "EditControl";
