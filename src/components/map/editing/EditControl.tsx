
import React, { forwardRef, useEffect } from 'react';
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import L from 'leaflet';
import { applyVisibilityPatches } from '@/utils/leaflet-patches/path-visibility-patch';
import { applyPolygonDrawPatches, initGlobalPolygonPatch } from '@/utils/leaflet-patches/polygon-draw-patch';
import { applyEditModePatch } from '@/utils/leaflet-patches/edit-mode-patch';
import { initializeFeatureGroupEditing } from './LayerEditHandler';

// Initialize global polygon patch on module load
initGlobalPolygonPatch();

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
  // Apply all patches for Leaflet
  useEffect(() => {
    // Apply path visibility patches
    const cleanup = applyVisibilityPatches();
    
    // Apply polygon drawing patches
    applyPolygonDrawPatches();
    
    // Apply edit mode patches
    applyEditModePatch();
    
    return cleanup;
  }, []);
  
  // Make sure we have a valid featureGroup before proceeding
  if (!featureGroup || !featureGroup.getLayers) {
    console.warn("EditControl: Invalid featureGroup provided");
    return null;
  }
  
  // Setup editing capabilities for layers in the feature group
  useEffect(() => {
    if (featureGroup) {
      initializeFeatureGroupEditing(featureGroup);
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
