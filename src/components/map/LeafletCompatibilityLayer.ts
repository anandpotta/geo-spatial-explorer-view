
// This file provides compatibility with newer versions of react-leaflet-draw
// by ensuring that we can still pass certain props like featureGroup to EditControl
import { EditControl as OriginalEditControl } from "react-leaflet-draw";
import React, { forwardRef } from 'react';
import L from 'leaflet';

// Patch the readableArea function in L.Draw.Rectangle
if (typeof L !== 'undefined' && L.Draw && L.Draw.Rectangle) {
  // Fix the 'type is not defined' error by ensuring we use the proper reference
  // Use type assertion to access the private method
  const originalReadableArea = (L.Draw.Rectangle.prototype as any)._getTooltipText;
  if (originalReadableArea) {
    (L.Draw.Rectangle.prototype as any)._getTooltipText = function() {
      const result = originalReadableArea.call(this);
      
      // Fix the measurement calculation if needed
      if (this._shape && result.text && result.subtext && typeof (this as any).type === 'undefined') {
        // Use 'rectangle' as the type if it's undefined
        const area = (L as any).GeometryUtil.geodesicArea(this._shape.getLatLngs()[0]);
        const readableArea = (L as any).GeometryUtil.readableArea(area, true);
        result.subtext = readableArea;
      }
      
      return result;
    };
  }
}

// Create a wrapper component that forwards the ref and handles the featureGroup prop
export const EditControl = forwardRef((props: any, ref: any) => {
  // Extract featureGroup from props to ensure it's correctly passed
  const { featureGroup, edit, ...otherProps } = props;
  
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
  
  // Create the element with React.createElement to properly pass the ref
  return React.createElement(OriginalEditControl, {
    ...otherProps,
    edit: editOptions,
    ref: ref
  });
});

EditControl.displayName = "EditControl";
