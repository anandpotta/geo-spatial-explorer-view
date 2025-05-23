
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import L from 'leaflet';

// Apply patches to leaflet-draw to fix known issues
const applyLeafletDrawPatches = () => {
  // Fix for the "type is not defined" error in readableArea
  try {
    if (L.Draw && L.Draw.Polygon) {
      // Patch the readableArea function to provide a fallback for the missing type variable
      const polygonProto = L.Draw.Polygon.prototype as any;
      if (polygonProto && polygonProto._getTooltipText) {
        const originalPolygonTooltip = polygonProto._getTooltipText;
        polygonProto._getTooltipText = function() {
          try {
            return originalPolygonTooltip.apply(this, arguments);
          } catch (err) {
            // Fallback when error occurs in readableArea
            return {
              text: 'Click to continue drawing shape',
              subtext: ''
            };
          }
        };
      }
      
      // Also patch Rectangle to use the same safe implementation
      if (L.Draw.Rectangle) {
        const rectangleProto = L.Draw.Rectangle.prototype as any;
        if (rectangleProto && rectangleProto._getTooltipText) {
          const originalRectTooltip = rectangleProto._getTooltipText;
          rectangleProto._getTooltipText = function() {
            try {
              return originalRectTooltip.apply(this, arguments);
            } catch (err) {
              // Fallback when error occurs in tooltip text generation
              return {
                text: 'Click and drag to draw rectangle',
                subtext: ''
              };
            }
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to apply Leaflet Draw patches:', error);
  }
};

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
    if (!editOptions.selectedPathOptions) {
      editOptions.selectedPathOptions = {
        maintainColor: true,
        opacity: 0.7
      };
    }
  } else {
    // Default case if edit is undefined or null - create empty object but don't enable editing
    editOptions = {
      featureGroup: featureGroup,
      edit: false, // Explicitly disable editing
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  }
  
  // Add a patching function to ensure all layers have properly initialized edit handlers
  // This is necessary because react-leaflet-draw may try to access edit methods on layers that don't have them
  if (featureGroup) {
    try {
      // Safety guard to ensure we don't try to access properties on undefined
      setTimeout(() => {
        // Check if featureGroup exists and has layers
        if (featureGroup && featureGroup.getLayers) {
          const layers = featureGroup.getLayers();
          
          // Patch each layer to ensure it has the necessary edit methods
          layers.forEach(layer => {
            // Only add if not already present
            if (layer && !layer.enableEdit) {
              layer.enableEdit = function() { return this; };
            }
            if (layer && !layer.disableEdit) {
              layer.disableEdit = function() { return this; };
            }
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
