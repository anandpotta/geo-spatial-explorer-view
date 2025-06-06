
import L from 'leaflet';

/**
 * Patches drawing tools to fix tooltip and readableArea issues
 */
export const patchDrawingTools = () => {
  try {
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
  } catch (error) {
    console.error('Failed to patch drawing tools:', error);
  }
};
