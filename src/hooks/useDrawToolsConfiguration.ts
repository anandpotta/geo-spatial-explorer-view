
import { useEffect } from 'react';
import L from 'leaflet';

export function useDrawToolsConfiguration(featureGroup: L.FeatureGroup | null) {
  useEffect(() => {
    if (!featureGroup) return;
    
    try {
      // Apply patches for Leaflet Draw Rectangle functionality
      if (L.Draw && L.Draw.Rectangle) {
        // Fix for area calculation in Rectangle
        const rectangleProto = L.Draw.Rectangle.prototype as any;
        if (rectangleProto && rectangleProto._getTooltipText) {
          const originalGetTooltipText = rectangleProto._getTooltipText;
          rectangleProto._getTooltipText = function() {
            try {
              // Try original method
              return originalGetTooltipText.apply(this, arguments);
            } catch (err) {
              console.log('Patched error in Rectangle tooltip:', err);
              // Fallback to simplified tooltip
              const tooltipText = {
                text: this._initialLabelText || 'Click and drag to draw rectangle',
                subtext: ''
              };
              
              if (this._shape) {
                tooltipText.text = 'Release to finish drawing';
              }
              
              return tooltipText;
            }
          };
        }
      }
      
      // Enhance the Circle draw handler to ensure SVG rendering
      if (L.Draw && L.Draw.Circle) {
        const circleProto = L.Draw.Circle.prototype as any;
        
        // Make sure Circle uses SVG renderer
        if (circleProto && circleProto._fireCreatedEvent) {
          const originalFireCreatedEvent = circleProto._fireCreatedEvent;
          circleProto._fireCreatedEvent = function() {
            try {
              // Force SVG renderer for the circle
              if (this.options && this.options.shapeOptions) {
                this.options.shapeOptions.renderer = L.svg();
                this.options.shapeOptions.stroke = true;
                this.options.shapeOptions.opacity = 1;
              }
              
              // Call original method
              return originalFireCreatedEvent.apply(this, arguments);
            } catch (err) {
              console.error('Error in circle creation:', err);
              return originalFireCreatedEvent.apply(this, arguments);
            }
          };
        }
      }
      
      // Patch metric calculation for area display
      if (typeof L.GeometryUtil !== 'undefined' && L.GeometryUtil.readableArea) {
        const originalReadableArea = L.GeometryUtil.readableArea;
        L.GeometryUtil.readableArea = function(area: number, isMetric?: boolean, precision?: any) {
          try {
            return originalReadableArea.call(this, area, isMetric, precision);
          } catch (err) {
            console.log('Patched error in readableArea:', err);
            const metricLabel = isMetric ? 'm²' : 'ft²';
            return Math.round(area) + ' ' + metricLabel;
          }
        };
      }
    } catch (err) {
      console.error('Error patching Leaflet Draw:', err);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [featureGroup]);
}

// Add a function to handle type errors in the leaflet-draw plugin
export const patchLeafletDraw = () => {
  if (typeof window !== 'undefined' && window.L) {
    const L = window.L;
    
    // Fix "type is not defined" error in readableArea
    if (L.GeometryUtil) {
      // Override the readableArea method with a safe implementation
      const originalReadableArea = L.GeometryUtil.readableArea;
      L.GeometryUtil.readableArea = function(area: number, isMetric?: boolean, precision?: any) {
        try {
          // Try to use original implementation but with safety
          return originalReadableArea.call(this, area, isMetric, precision);
        } catch (err) {
          // Fallback implementation
          if (!isMetric) {
            // Convert to feet
            const areaFeet = area * 10.764;
            return Math.round(areaFeet) + ' ft²';
          }
          // Default to metric
          return Math.round(area) + ' m²';
        }
      };
    }
    
    // Ensure circles are rendered as SVG paths
    if (L.Draw && L.Draw.Circle) {
      // Store original Circle class initialization
      const originalInitialize = L.Draw.Circle.prototype.initialize;
      if (originalInitialize) {
        L.Draw.Circle.prototype.initialize = function(map: any, options?: any) {
          // Call the original initialization
          originalInitialize.call(this, map, options);
          
          // Force SVG renderer and stroke options
          if ((this as any).options && (this as any).options.shapeOptions) {
            (this as any).options.shapeOptions.renderer = L.svg();
            (this as any).options.shapeOptions.stroke = true;
            (this as any).options.shapeOptions.opacity = 1;
          }
        };
      }
    }
  }
};
