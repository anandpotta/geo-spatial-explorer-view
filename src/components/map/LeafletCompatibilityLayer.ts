
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import { applyLeafletDrawPatches, patchLayerForEdit } from '@/utils/leaflet-patching';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Apply patches when component mounts
  useEffect(() => {
    applyLeafletDrawPatches();
  }, []);
  
  // Format the edit options properly based on what was passed
  let editOptions;
  
  // Handle different types of edit parameters
  if (edit === true) {
    // If edit is boolean true, create a proper object structure
    editOptions = { 
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7
        }
      }
    };
  } else if (edit === false) {
    // If edit is boolean false, disable edit entirely
    editOptions = null;
  } else if (edit && typeof edit === 'object') {
    // If edit is an object, merge with featureGroup but don't overwrite featureGroup
    editOptions = {
      ...edit,
      featureGroup: featureGroup
    };
    
    // Ensure selectedPathOptions is properly defined if not already
    if (editOptions.edit && !editOptions.edit.selectedPathOptions) {
      editOptions.edit.selectedPathOptions = {
        maintainColor: true,
        opacity: 0.7
      };
    }
  } else {
    // Default case - enable both edit and remove
    editOptions = {
      featureGroup: featureGroup,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.7
        }
      },
      remove: true
    };
  }
  
  // Enhanced patching function to ensure all layers have properly initialized edit handlers
  if (featureGroup) {
    try {
      // Safety guard to ensure we don't try to access properties on undefined
      setTimeout(() => {
        // Check if featureGroup exists and has layers
        if (featureGroup && featureGroup.getLayers) {
          const layers = featureGroup.getLayers();
          
          // Patch each layer to ensure it has the necessary edit methods
          layers.forEach(layer => {
            patchLayerForEdit(layer);
          });
        }
      }, 0);
    } catch (err) {
      console.error('Error patching layers for edit capability:', err);
    }
  }
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref: ref
  });
});

EditControl.displayName = "EditControl";
