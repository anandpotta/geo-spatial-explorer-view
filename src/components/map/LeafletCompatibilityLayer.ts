
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Define the default selectedPathOptions
  const defaultSelectedPathOptions = {
    maintainColor: true,
    opacity: 0.7
  };
  
  // Format the edit options properly based on what was passed
  let editOptions = { 
    featureGroup: featureGroup,
    selectedPathOptions: defaultSelectedPathOptions
  };
  
  // Handle different types of edit parameters
  if (edit === false) {
    // Even when edit is false, we need to include selectedPathOptions
    editOptions = { 
      featureGroup: featureGroup,
      selectedPathOptions: defaultSelectedPathOptions 
    };
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but don't overwrite featureGroup
    editOptions = {
      ...edit,
      featureGroup: featureGroup,
      // Ensure selectedPathOptions is defined by merging with defaults if it exists
      selectedPathOptions: edit.selectedPathOptions 
        ? edit.selectedPathOptions 
        : defaultSelectedPathOptions
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
