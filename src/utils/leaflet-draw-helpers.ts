
import L from 'leaflet';

/**
 * Initialize Leaflet Draw compatibility settings
 * Adds necessary utility functions if they don't exist
 */
export function initializeLeafletDrawCompatibility(): void {
  // Define draw version without direct assignment
  try {
    if (typeof L !== 'undefined' && !('drawVersion' in L)) {
      // Use defineProperty to avoid readonly errors
      Object.defineProperty(L, 'drawVersion', {
        value: '1.0.4',
        writable: false,
        configurable: false
      });
    }
  } catch (err) {
    console.warn('Could not define L.drawVersion:', err);
  }
  
  // Provide GeometryUtil functions if they don't exist
  if (typeof L !== 'undefined' && !(L as any).GeometryUtil) {
    // Define a minimal implementation of GeometryUtil
    (L as any).GeometryUtil = {
      // Area calculation for polygons
      geodesicArea: function(latLngs: any) {
        let area = 0;
        if (latLngs && latLngs.length > 2) {
          try {
            // Use Leaflet's internal area calculation if available
            if (L.LatLngUtil && (L.LatLngUtil as any).geodesicArea) {
              area = Math.abs((L.LatLngUtil as any).geodesicArea(latLngs));
            } else {
              // Fallback calculation using Shoelace formula
              const points = latLngs.map((ll: any) => ({ 
                x: ll.lng * Math.cos(ll.lat * Math.PI / 180), 
                y: ll.lat 
              }));
              
              for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                area += points[i].x * points[j].y - points[j].x * points[i].y;
              }
              area = Math.abs(area) * (40075017 * 40075017 / (2 * Math.PI));
            }
          } catch (e) {
            console.error('Error calculating area:', e);
            area = 0;
          }
        }
        return area;
      },
      
      // Format the area as a readable string
      readableArea: function(area: number, isMetric = true) {
        if (isMetric) {
          if (area >= 10000) {
            return (area * 0.0001).toFixed(2) + ' ha';
          }
          return area.toFixed(2) + ' m²';
        } else {
          const areaInSqFeet = area * 10.764;
          if (areaInSqFeet >= 43560) {
            return (areaInSqFeet / 43560).toFixed(2) + ' acres';
          }
          return areaInSqFeet.toFixed(2) + ' ft²';
        }
      },
      
      // Required by type definition but minimally implemented
      distance: function(latlng1: L.LatLngExpression, latlng2: L.LatLngExpression) {
        return L.latLng(latlng1).distanceTo(L.latLng(latlng2));
      },
      
      // Format number with locale
      formattedNumber: function(num: number, precision: number) {
        return num.toFixed(precision || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },
      
      // Convert distance to readable format
      readableDistance: function(distance: number, unit?: string, isMetric = true) {
        let distanceStr;
        if (isMetric) {
          if (distance > 1000) {
            distanceStr = (distance / 1000).toFixed(2) + ' km';
          } else {
            distanceStr = distance.toFixed(0) + ' m';
          }
        } else {
          const distanceInFeet = distance * 3.28084;
          if (distanceInFeet > 5280) {
            distanceStr = (distanceInFeet / 5280).toFixed(2) + ' mi';
          } else {
            distanceStr = distanceInFeet.toFixed(0) + ' ft';
          }
        }
        return distanceStr;
      },
      
      // Version checker (required by type definition)
      isVersion07x: function() {
        return false;
      }
    };
  }
}
