
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Process the edit options to ensure they're in the correct format
  let processedEditOptions;
  
  if (edit === null || edit === false) {
    // If edit is null or false, we should pass null
    processedEditOptions = null;
  } else if (edit === true) {
    // If edit is true, create a proper options object
    processedEditOptions = {
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  } else if (typeof edit === 'object') {
    // If edit is an object, ensure it has the correct structure
    processedEditOptions = {
      ...edit,
      featureGroup: featureGroup
    };
    
    // Handle the nested edit property if it exists and is a boolean
    if (processedEditOptions.edit === true) {
      // Replace boolean true with proper options
      processedEditOptions.edit = {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7
        }
      };
    } else if (processedEditOptions.edit === false) {
      // Replace boolean false with null
      processedEditOptions.edit = null;
    }
    
    // Ensure selectedPathOptions is defined
    if (!processedEditOptions.selectedPathOptions) {
      processedEditOptions.selectedPathOptions = {
        maintainColor: true,
        opacity: 0.7
      };
    }
  } else {
    // Default case - create standard edit options
    processedEditOptions = {
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  }
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: processedEditOptions,
    featureGroup: featureGroup,
    ref: ref
  });
});

EditControl.displayName = "EditControl";
