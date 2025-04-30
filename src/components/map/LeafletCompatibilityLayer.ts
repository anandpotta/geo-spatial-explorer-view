
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import L from 'leaflet';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Make sure we have a valid featureGroup before proceeding
  if (!featureGroup || !featureGroup.getLayers) {
    console.warn("EditControl: Invalid featureGroup provided");
    return null;
  }
  
  // Ensure all layers in the feature group have edit handlers
  useEffect(() => {
    if (featureGroup) {
      try {
        // Ensure each layer has the necessary edit properties
        featureGroup.eachLayer((layer: any) => {
          if (layer && !layer.editing) {
            // Initialize editing capability if not present
            if (layer instanceof L.Path) {
              // Use type assertion to handle the PolyEdit constructor
              layer.editing = new (L.Handler as any).PolyEdit(layer);
              
              // Ensure the editing handler has disable and enable methods
              if (layer.editing && !layer.editing.disable) {
                layer.editing.disable = function() {
                  // No-op function to prevent errors
                  console.log("Disable called on layer without proper handler");
                };
              }
              
              if (layer.editing && !layer.editing.enable) {
                layer.editing.enable = function() {
                  // No-op function to prevent errors
                  console.log("Enable called on layer without proper handler");
                };
              }
            }
          }
        });
      } catch (err) {
        console.error("Error preparing layers for edit mode:", err);
      }
    }
    
    return () => {
      // Cleanup on unmount - ensure we disable edit mode properly
      if (featureGroup) {
        try {
          featureGroup.eachLayer((layer: any) => {
            if (layer && layer.editing) {
              // Check if disable exists before calling it
              if (typeof layer.editing.disable === 'function') {
                layer.editing.disable();
              }
            }
          });
        } catch (err) {
          console.error("Error cleaning up edit mode:", err);
        }
      }
    };
  }, [featureGroup]);
  
  // Ensure we have a proper edit options structure
  const editOptions = {
    featureGroup: featureGroup,
    // Set some sensible defaults for edit handlers
    edit: true,
    remove: true,
    // Ensure we have proper edit handler initialization
    ...(typeof edit === 'object' ? edit : {})
  };
  
  // Return the original EditControl with proper prop structure
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref
  });
});

EditControl.displayName = "EditControl";
