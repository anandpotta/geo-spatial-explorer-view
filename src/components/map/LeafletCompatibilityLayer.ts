
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef, useEffect, useRef } from 'react';

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  const controlRef = useRef<any>(null);
  
  // Format the edit options properly based on what was passed
  let editOptions;
  
  // Handle different types of edit parameters
  if (edit === true) {
    // If edit is boolean true, create a proper object structure
    editOptions = { 
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  } else if (edit === false) {
    // If edit is boolean false, we need to use null instead
    // react-leaflet-draw expects null or an object, not boolean false
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
    // Default case if edit is undefined or null
    editOptions = {
      featureGroup: featureGroup,
      selectedPathOptions: {
        maintainColor: true,
        opacity: 0.7
      }
    };
  }
  
  // Handle cleanup safely
  useEffect(() => {
    return () => {
      try {
        // Clean up any potential references that might cause the dispose error
        if (controlRef.current) {
          // Safely clean up references to prevent errors during unmount
          const control = controlRef.current;
          
          // Check if the control has a _toolbars property and clean it up
          if (control._toolbars) {
            Object.keys(control._toolbars).forEach(toolbarKey => {
              const toolbar = control._toolbars[toolbarKey];
              if (toolbar && toolbar._modes) {
                Object.keys(toolbar._modes).forEach(modeKey => {
                  const mode = toolbar._modes[modeKey];
                  if (mode && mode.handler) {
                    // Ensure handler has all required properties before disposal
                    if (mode.handler._shape) {
                      mode.handler._shape = null;
                    }
                    if (mode.handler._shapes) {
                      mode.handler._shapes = null;
                    }
                    if (mode.handler._map && !mode.handler._disposed) {
                      try {
                        // Mark as disposed to prevent multiple disposal attempts
                        mode.handler._disposed = true;
                      } catch (e) {
                        console.error("Error during handler cleanup:", e);
                      }
                    }
                  }
                });
              }
            });
          }
        }
      } catch (e) {
        console.error("Error during EditControl cleanup:", e);
      }
    };
  }, []);
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref: (r: any) => {
      controlRef.current = r;
      if (typeof ref === 'function') {
        ref(r);
      } else if (ref) {
        ref.current = r;
      }
    }
  });
});

EditControl.displayName = "EditControl";
