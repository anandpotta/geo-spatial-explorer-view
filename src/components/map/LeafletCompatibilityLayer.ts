
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect } from 'react';
import L from 'leaflet';

// Enhanced layer patching function
const patchLayerForEdit = (layer: any) => {
  if (!layer) return layer;
  
  // Add enableEdit method if missing
  if (!layer.enableEdit || typeof layer.enableEdit !== 'function') {
    layer.enableEdit = function() { 
      console.log('Edit enabled on layer:', this);
      if (this.editing && this.editing.enable) {
        try {
          this.editing.enable();
        } catch (err) {
          console.warn('Error enabling layer editing:', err);
        }
      }
      return this; 
    };
  }
  
  // Add disableEdit method if missing
  if (!layer.disableEdit || typeof layer.disableEdit !== 'function') {
    layer.disableEdit = function() { 
      console.log('Edit disabled on layer:', this);
      if (this.editing && this.editing.disable) {
        try {
          this.editing.disable();
        } catch (err) {
          console.warn('Error disabling layer editing:', err);
        }
      }
      return this; 
    };
  }
  
  // Add enable method if missing (for toolbar compatibility)
  if (!layer.enable || typeof layer.enable !== 'function') {
    layer.enable = function() { 
      return this.enableEdit();
    };
  }
  
  // Add disable method if missing (for toolbar compatibility)  
  if (!layer.disable || typeof layer.disable !== 'function') {
    layer.disable = function() { 
      return this.disableEdit();
    };
  }
  
  return layer;
};

// Apply patches to leaflet-draw to fix known issues
const applyLeafletDrawPatches = () => {
  try {
    // Patch the edit toolbar to safely handle layers without edit methods
    if (L.EditToolbar && L.EditToolbar.Edit) {
      const editProto = L.EditToolbar.Edit.prototype as any;
      
      // Patch _enableLayerEdit to safely handle layers
      if (editProto && editProto._enableLayerEdit) {
        const original_enableLayerEdit = editProto._enableLayerEdit;
        editProto._enableLayerEdit = function(layer: any) {
          try {
            // Patch the layer first
            patchLayerForEdit(layer);
            // Then call original function
            return original_enableLayerEdit.call(this, layer);
          } catch (err) {
            console.warn('Error in _enableLayerEdit:', err);
            return layer;
          }
        };
      }
      
      // Patch _disableLayerEdit to safely handle layers
      if (editProto && editProto._disableLayerEdit) {
        const original_disableLayerEdit = editProto._disableLayerEdit;
        editProto._disableLayerEdit = function(layer: any) {
          try {
            // Ensure layer has disable methods
            patchLayerForEdit(layer);
            // Then call original function
            return original_disableLayerEdit.call(this, layer);
          } catch (err) {
            console.warn('Error in _disableLayerEdit:', err);
            return layer;
          }
        };
      }
      
      // Enhanced addHooks method to patch all layers
      if (editProto && editProto.addHooks) {
        const originalAddHooks = editProto.addHooks;
        editProto.addHooks = function() {
          // Patch all layers in the feature group before enabling edit
          const featureGroup = this.options.featureGroup;
          if (featureGroup && featureGroup.eachLayer) {
            featureGroup.eachLayer((layer: any) => {
              patchLayerForEdit(layer);
            });
          }
          
          return originalAddHooks.call(this);
        };
      }
    }
    
    // Fix for the "type is not defined" error in readableArea
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
    
    // Patch edit toolbar to properly handle layer detection
    if (L.EditToolbar && L.EditToolbar.Edit) {
      const editProto = L.EditToolbar.Edit.prototype as any;
      if (editProto && editProto._checkDisabled) {
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
