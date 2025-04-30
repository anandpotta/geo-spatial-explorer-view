
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect, useRef } from 'react';
import L from 'leaflet';

// Ensure we have proper safeguards for EditControl
const enhanceEditOptions = (featureGroup: L.FeatureGroup) => {
  if (!featureGroup) return {};
  
  return {
    featureGroup: featureGroup,
    edit: {
      featureGroup: featureGroup,
      edit: true,
      remove: true,
      poly: {
        allowIntersection: false
      },
      selectedPathOptions: {
        maintainColor: false,
        opacity: 0.7
      }
    }
  };
};

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  const instanceRef = useRef<any>(null);
  const { featureGroup, edit, ...otherProps } = props;
  
  // Make sure we have a valid featureGroup to prevent errors
  if (!featureGroup) {
    console.warn('EditControl received null or undefined featureGroup');
    return null;
  }
  
  // Use safer options
  const editOptions = enhanceEditOptions(featureGroup);
  
  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        // Handle the case where the EditControl instance might have invalid handlers
        if (instanceRef.current) {
          const instance = instanceRef.current;
          
          // Safely clean up any handlers that might be causing the issue
          if (instance._toolbars && instance._toolbars.edit) {
            Object.values(instance._toolbars.edit._modes || {}).forEach((mode: any) => {
              if (!mode || !mode.handler) return;
              
              // Add safety checks and cleanup
              try {
                // Ensure the handler object itself is valid
                if (mode.handler._verticesHandlers) {
                  Object.values(mode.handler._verticesHandlers).forEach((vh: any) => {
                    // Make the handler safe by ensuring it has a dispose method
                    if (vh && !vh.dispose) {
                      vh.dispose = function() {}; // Add empty dispose method
                    }
                  });
                }
                
                // Make sure any marker edits have a dispose method
                if (mode.handler._markerGroup) {
                  mode.handler._markerGroup.clearLayers();
                }
                
                // Ensure disable method exists and is safe
                if (mode.handler && typeof mode.handler.disable !== 'function') {
                  mode.handler.disable = function() {};
                }
              } catch (e) {
                console.warn("Error patching handler:", e);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error during EditControl cleanup:", err);
      }
    };
  }, []);
  
  // Return the original EditControl with proper prop structure and ref handling
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    position: 'topright',
    draw: {
      rectangle: true,
      polygon: true,
      circle: true,
      circlemarker: false,
      marker: true,
      polyline: false
    },
    edit: editOptions,
    featureGroup: featureGroup,
    ref: (el: any) => {
      // Store instance for our cleanup
      instanceRef.current = el;
      
      // Forward ref
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    }
  });
});

EditControl.displayName = "EditControl";
