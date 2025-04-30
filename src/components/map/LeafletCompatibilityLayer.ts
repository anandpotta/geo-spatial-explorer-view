
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
        // Add proper edit options with safe defaults
        selectedPathOptions: {
          maintainColor: false,
          opacity: 0.7
        },
        // Apply error handling to edit handlers
        edit: {
          noMissingHandlers: true
        }
      }
    };
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but don't overwrite featureGroup
    editOptions = {
      ...edit,
      featureGroup: featureGroup,
      edit: {
        ...edit.edit,
        // Ensure edit handlers have proper error handling
        selectedPathOptions: edit.selectedPathOptions || {
          maintainColor: false,
          opacity: 0.7
        },
        noMissingHandlers: true
      }
    };
  } else {
    // Default case if edit is undefined or null
    editOptions = {
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: false,
          opacity: 0.7
        },
        noMissingHandlers: true
      }
    };
  }
  
  // Return the original EditControl with proper prop structure
  // Important: Do not pass featureGroup at top level as it causes confusion
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref
  });
});

EditControl.displayName = "EditControl";
