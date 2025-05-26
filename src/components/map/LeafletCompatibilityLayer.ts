
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import L from 'leaflet';

// Enhanced layer patching to prevent edit errors
const patchLayerForEditing = (layer: any) => {
  if (!layer) return;
  
  // Add all required edit methods if missing
  const requiredMethods = ['enable', 'disable', 'enableEdit', 'disableEdit'];
  
  requiredMethods.forEach(methodName => {
    if (!layer[methodName] || typeof layer[methodName] !== 'function') {
      layer[methodName] = function() { 
        console.log(`${methodName} called on patched layer`);
        return this; 
      };
    }
  });
  
  // Add editing state tracking
  if (!layer._leaflet_editing_enabled) {
    layer._leaflet_editing_enabled = false;
  }
  
  // Ensure the layer has proper event handling
  if (!layer.on || typeof layer.on !== 'function') {
    layer.on = function() { return this; };
  }
  if (!layer.off || typeof layer.off !== 'function') {
    layer.off = function() { return this; };
  }
};

// Apply patches to leaflet-draw to fix known issues
const applyLeafletDrawPatches = () => {
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
            return {
              text: 'Click to continue drawing shape',
              subtext: ''
            };
          }
        };
      }
      
      if (L.Draw.Rectangle) {
        const rectangleProto = L.Draw.Rectangle.prototype as any;
        if (rectangleProto && rectangleProto._getTooltipText) {
          const originalRectTooltip = rectangleProto._getTooltipText;
          rectangleProto._getTooltipText = function() {
            try {
              return originalRectTooltip.apply(this, arguments);
            } catch (err) {
              return {
                text: 'Click and drag to draw rectangle',
                subtext: ''
              };
            }
          };
        }
      }
    }
    
    // Enhanced edit toolbar patching with better error handling
    if (L.EditToolbar && L.EditToolbar.Edit) {
      const editProto = L.EditToolbar.Edit.prototype as any;
      
      if (editProto) {
        // Override _enableLayerEdit to safely handle layers
        const original_enableLayerEdit = editProto._enableLayerEdit;
        editProto._enableLayerEdit = function(layer: any) {
          try {
            // Patch the layer first
            patchLayerForEditing(layer);
            
            // Then try to enable editing with fallback
            if (layer && typeof layer.enable === 'function') {
              layer.enable();
            } else if (layer && typeof layer.enableEdit === 'function') {
              layer.enableEdit();
            }
          } catch (err) {
            console.warn('Could not enable editing for layer:', err);
          }
        };
        
        // Override _disableLayerEdit to safely handle layers
        const original_disableLayerEdit = editProto._disableLayerEdit;
        editProto._disableLayerEdit = function(layer: any) {
          try {
            // Ensure layer has required methods before disabling
            patchLayerForEditing(layer);
            
            // Then try to disable editing with fallback
            if (layer && typeof layer.disable === 'function') {
              layer.disable();
            } else if (layer && typeof layer.disableEdit === 'function') {
              layer.disableEdit();
            }
          } catch (err) {
            console.warn('Could not disable editing for layer:', err);
          }
        };
        
        // Override addHooks to safely iterate through layers
        const originalAddHooks = editProto.addHooks;
        editProto.addHooks = function() {
          try {
            const featureGroup = this.options.featureGroup;
            if (featureGroup && featureGroup.eachLayer) {
              // Patch all layers before enabling editing
              featureGroup.eachLayer((layer: any) => {
                patchLayerForEditing(layer);
              });
            }
            
            // Call original addHooks
            return originalAddHooks.apply(this, arguments);
          } catch (err) {
            console.error('Error in addHooks:', err);
            // Try to continue anyway
            return originalAddHooks.apply(this, arguments);
          }
        };
        
        // Override removeHooks to safely handle layer cleanup
        const originalRemoveHooks = editProto.removeHooks;
        editProto.removeHooks = function() {
          try {
            const featureGroup = this.options.featureGroup;
            if (featureGroup && featureGroup.eachLayer) {
              // Patch all layers before disabling editing
              featureGroup.eachLayer((layer: any) => {
                patchLayerForEditing(layer);
              });
            }
            
            // Call original removeHooks
            return originalRemoveHooks.apply(this, arguments);
          } catch (err) {
            console.error('Error in removeHooks:', err);
            // Try to continue anyway with safe fallback
            try {
              return originalRemoveHooks.apply(this, arguments);
            } catch (fallbackErr) {
              console.error('Fallback removeHooks also failed:', fallbackErr);
            }
          }
        };
        
        const originalCheckDisabled = editProto._checkDisabled;
        editProto._checkDisabled = function() {
          // Always allow editing if there are any layers or SVG paths
          const featureGroup = this.options.featureGroup;
          if (featureGroup) {
            // Check for layers in feature group
            const layers = featureGroup.getLayers();
            if (layers && layers.length > 0) {
              return false; // Enable editing
            }
            
            // Check for SVG paths in the map
            const map = featureGroup._map;
            if (map) {
              const container = map.getContainer();
              if (container) {
                const paths = container.querySelectorAll('.leaflet-overlay-pane path');
                if (paths.length > 0) {
                  return false; // Enable editing
                }
              }
            }
          }
          
          // Fall back to original check
          return originalCheckDisabled.apply(this, arguments);
        };
      }
    }
    
    // Patch delete toolbar similarly
    if (L.EditToolbar && L.EditToolbar.Delete) {
      const deleteProto = L.EditToolbar.Delete.prototype as any;
      if (deleteProto && deleteProto._checkDisabled) {
        const originalCheckDisabled = deleteProto._checkDisabled;
        deleteProto._checkDisabled = function() {
          // Always allow deleting if there are any layers or SVG paths
          const featureGroup = this.options.featureGroup;
          if (featureGroup) {
            // Check for layers in feature group
            const layers = featureGroup.getLayers();
            if (layers && layers.length > 0) {
              return false; // Enable deleting
            }
            
            // Check for SVG paths in the map
            const map = featureGroup._map;
            if (map) {
              const container = map.getContainer();
              if (container) {
                const paths = container.querySelectorAll('.leaflet-overlay-pane path');
                if (paths.length > 0) {
                  return false; // Enable deleting
                }
              }
            }
          }
          
          // Fall back to original check
          return originalCheckDisabled.apply(this, arguments);
        };
      }
    }
    
    // Enhanced FeatureGroup patching
    if (L.FeatureGroup) {
      const featureGroupProto = L.FeatureGroup.prototype as any;
      
      // Override addLayer to automatically patch layers
      const originalAddLayer = featureGroupProto.addLayer;
      featureGroupProto.addLayer = function(layer: any) {
        // Patch the layer before adding it
        patchLayerForEditing(layer);
        
        // Call original addLayer
        return originalAddLayer.apply(this, arguments);
      };
      
      // Override eachLayer to ensure all layers are patched when accessed
      const originalEachLayer = featureGroupProto.eachLayer;
      featureGroupProto.eachLayer = function(fn: any, context?: any) {
        // Patch each layer before calling the function on it
        const safeFn = function(layer: any) {
          patchLayerForEditing(layer);
          return fn.call(context || this, layer);
        };
        
        // Call original eachLayer with the safe function
        return originalEachLayer.call(this, safeFn, context);
      };
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
  
  // Enhanced layer patching for the feature group
  if (featureGroup) {
    try {
      setTimeout(() => {
        // Check if featureGroup exists and has layers
        if (featureGroup && featureGroup.getLayers) {
          const layers = featureGroup.getLayers();
          
          // Patch each layer to ensure it has the necessary edit methods
          layers.forEach((layer: any) => {
            patchLayerForEditing(layer);
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
