
import L from 'leaflet';

/**
 * Fixes the "type is not defined" error in the Leaflet Draw library's area calculation
 */
export const fixTypeIsNotDefinedError = (): () => void => {
  // Fix the "type is not defined" error in L.GeometryUtil.readableArea
  if (L.GeometryUtil && L.GeometryUtil.readableArea) {
    const originalReadableArea = L.GeometryUtil.readableArea;
    
    // Override with a fixed version that avoids the 'type is not defined' error
    L.GeometryUtil.readableArea = function(area: number, isMetric: boolean, precision?: any) {
      // The original function tries to use 'type' which is undefined
      // We'll implement a fixed version
      const areaStr = area.toFixed(2);
      const metricUnit = 'm²';
      const imperialUnit = 'ft²';
      
      if (isMetric) {
        if (area >= 10000) {
          return (area / 10000).toFixed(2) + ' ha';
        }
        return areaStr + ' ' + metricUnit;
      } else {
        // Convert to square feet
        const sqFeet = area * 10.7639;
        if (sqFeet > 43560) {
          // Convert to acres (43560 sq feet per acre)
          return (sqFeet / 43560).toFixed(2) + ' acres';
        }
        return sqFeet.toFixed(2) + ' ' + imperialUnit;
      }
    };
    
    return () => {
      // Restore original function
      L.GeometryUtil.readableArea = originalReadableArea;
    };
  }
  
  // If the function doesn't exist (which would be strange), create it
  else if (L.GeometryUtil && !L.GeometryUtil.readableArea) {
    L.GeometryUtil.readableArea = function(area: number, isMetric: boolean) {
      const areaStr = area.toFixed(2);
      return isMetric ? areaStr + ' m²' : (area * 10.7639).toFixed(2) + ' ft²';
    };
    
    return () => {
      // Clean up by adding our added function
      if (L.GeometryUtil) {
        delete L.GeometryUtil.readableArea;
      }
    };
  }
  
  // Fallback empty cleanup function
  return () => {};
};

/**
 * Create a helper function to get corners from bounds without modifying the prototype
 */
export const getCorners = function(bounds: L.LatLngBounds): L.LatLng[] {
  return [
    bounds.getNorthWest(),
    bounds.getNorthEast(),
    bounds.getSouthEast(),
    bounds.getSouthWest(),
    bounds.getNorthWest() // Close the polygon
  ];
};

/**
 * Extends GeometryUtil with the getCorners function
 */
export const extendGeometryUtil = (): () => void => {
  // Extend GeometryUtil if it exists
  if (L.GeometryUtil) {
    (L.GeometryUtil as any).getCorners = getCorners;
  }

  // Return a cleanup function
  return () => {
    // Clean up our enhancement
    if (L.GeometryUtil) {
      delete (L.GeometryUtil as any).getCorners;
    }
  };
};
