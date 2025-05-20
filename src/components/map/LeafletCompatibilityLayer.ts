
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Format the edit options properly based on what was passed
  let editOptions;
  
  // Handle different types of edit parameters
  if (edit === true) {
    // If edit is boolean true, create a proper object structure
    editOptions = { 
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  } else if (edit === false) {
    // If edit is boolean false, we need to use null instead
    // react-leaflet-draw expects null or an object, not boolean false
    editOptions = null;
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but don't overwrite featureGroup
    editOptions = {
      ...edit,
      featureGroup: featureGroup
    };
    
    // Ensure selectedPathOptions is properly defined if not already
    if (!editOptions.selectedPathOptions) {
      editOptions.selectedPathOptions = {
        maintainColor: true,
        opacity: 0.7
      };
    }
  } else {
    // Default case if edit is undefined or null
    editOptions = {
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  }
  
  return <OriginalEditControl {...otherProps} edit={editOptions} ref={ref} />;
});

EditControl.displayName = "EditControl";
