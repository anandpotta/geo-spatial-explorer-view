
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import L from 'leaflet';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Apply patch for the "type is not defined" error in Leaflet Draw
  useEffect(() => {
    // Patch the readableArea function to ensure 'type' is defined
    if (L.Draw && L.Draw.Polygon && L.Draw.Polygon.prototype) {
      const originalReadableArea = L.Draw.Polygon.prototype._getTooltipText;
      if (originalReadableArea) {
        L.Draw.Polygon.prototype._getTooltipText = function() {
          try {
            return originalReadableArea.apply(this);
          } catch (err) {
            // If the error is about 'type', provide a default text
            if (err.toString().includes('type is not defined')) {
              const result: any = {};
              result.text = this._endLabelText || 'Click first point to close this shape';
              result.subtext = this._getMeasurementString();
              return result;
            }
            throw err;
          }
        };
      }
    }
  }, []);
  
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
              // Create a properly typed handler
              const editHandler = new (L.Handler as any).PolyEdit(layer);
              
              // Add fallback methods with proper type annotations
              if (!editHandler.disable) {
                editHandler.disable = function(): void {
                  // No-op function to prevent errors
                  console.log("Disable called on layer without proper handler");
                };
              }
              
              if (!editHandler.enable) {
                editHandler.enable = function(): void {
                  // No-op function to prevent errors
                  console.log("Enable called on layer without proper handler");
                };
              }
              
              // Assign the properly typed handler
              layer.editing = editHandler;
            }
          } else if (layer && layer.editing) {
            // Ensure the editing handler has required methods
            if (!layer.editing.disable) {
              layer.editing.disable = function(): void {
                console.log("Disable called on layer with incomplete handler");
              };
            }
            
            if (!layer.editing.enable) {
              layer.editing.enable = function(): void {
                console.log("Enable called on layer with incomplete handler");
              };
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
    edit: {
      featureGroup: featureGroup,
      selectedPathOptions: {
        dashArray: '10, 10',
        fill: true,
        fillColor: '#fe57a1',
        fillOpacity: 0.1,
        maintainColor: false
      }
    },
    remove: true,
    // Merge user-provided edit options if present
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

// Patch L.Draw.Polygon.prototype to ensure readableArea is defined
if (typeof window !== 'undefined' && window.L && window.L.Draw) {
  try {
    // Create a global patch that will affect all instances
    const originalDraw = window.L.Draw;
    
    // If Leaflet Draw is loaded, patch the prototype
    if (originalDraw.Polygon) {
      const originalReadableArea = originalDraw.Polygon.prototype._getTooltipText;
      
      if (originalReadableArea) {
        originalDraw.Polygon.prototype._getTooltipText = function() {
          try {
            return originalReadableArea.apply(this);
          } catch (err) {
            // If error is about 'type is not defined', provide fallback
            console.log("Caught error in _getTooltipText:", err.message);
            const result: any = {};
            result.text = this._endLabelText || 'Click first point to close this shape';
            // Safely call _getMeasurementString with a type property defined
            try {
              result.subtext = this._getMeasurementString();
            } catch (measureErr) {
              result.subtext = "Calculate area after completion";
            }
            return result;
          }
        };
      }
    }
  } catch (err) {
    console.error("Error patching Leaflet Draw:", err);
  }
}

