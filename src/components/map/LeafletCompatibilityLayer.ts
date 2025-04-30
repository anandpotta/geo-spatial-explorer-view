
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';
import L from 'leaflet';

// Ensure we have proper safeguards for EditControl
const enhanceEditOptions = (featureGroup: L.FeatureGroup) => {
  if (!featureGroup) return {};
  
  return {
    featureGroup: featureGroup,
    edit: {
      featureGroup: featureGroup,
      edit: true,
      remove: true,
      poly: {
        allowIntersection: false
      },
      selectedPathOptions: {
        maintainColor: false,
        opacity: 0.7
      }
    }
  };
};

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Make sure we have a valid featureGroup to prevent errors
  if (!featureGroup) {
    console.warn('EditControl received null or undefined featureGroup');
    return null;
  }
  
  // Use safer options
  const editOptions = enhanceEditOptions(featureGroup);
  
  // Return the original EditControl with proper prop structure
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    position: 'topright',
    draw: {
      rectangle: true,
      polygon: true,
      circle: true,
      circlemarker: false,
      marker: true,
      polyline: false
    },
    edit: editOptions,
    featureGroup: featureGroup,
    ref
  });
});

EditControl.displayName = "EditControl";
