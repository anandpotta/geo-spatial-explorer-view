import L from 'leaflet';

/**
 * Patches Leaflet's Edit.Poly to prevent errors when enable is called
 */
export function applyEditModePatch(): void {
  if (!L.Edit || !L.Edit.Poly || !L.Edit.Poly.prototype) return;
  
  // Keep reference to original methods
  const originalEnable = L.Edit.Poly.prototype.enable;
  const originalAddHooks = L.Edit.Poly.prototype.addHooks;
  
  // Patch enable method
  L.Edit.Poly.prototype.enable = function() {
    try {
      // Make sure this._poly exists before enabling
      if (!this._poly) {
        console.warn("Attempted to enable edit on null _poly object");
        return;
      }
      
      // Make sure vertices exist before trying to access them
      if (!this._poly._map) {
        console.warn("Cannot enable editing for layer not on map");
        return;
      }
      
      // Call the original enable with proper safeguards
      return originalEnable.apply(this);
    } catch (err) {
      console.error("Error in Edit.Poly.enable:", err);
    }
  };
  
  // Patch addHooks method
  L.Edit.Poly.prototype.addHooks = function() {
    try {
      if (!this._poly || !this._poly._map) {
        console.warn("Cannot add hooks for edit poly - invalid state");
        return;
      }
      
      // Ensure this._markerGroup exists
      if (!this._markerGroup) {
        this._initMarkers();
      }
      
      return originalAddHooks.apply(this);
    } catch (err) {
      console.error("Error in Edit.Poly.addHooks:", err);
    }
  };
  
  // Patch EditToolbar.Edit._enableLayerEdit if it exists
  if (L.EditToolbar && L.EditToolbar.Edit && L.EditToolbar.Edit.prototype) {
    const originalEnableLayerEdit = L.EditToolbar.Edit.prototype._enableLayerEdit;
    
    if (originalEnableLayerEdit) {
      L.EditToolbar.Edit.prototype._enableLayerEdit = function(e: {layer: L.Layer}) {
        try {
          // First check if layer has valid editing capability
          if (!e.layer || !(e.layer as any).editing) {
            console.warn("Layer missing editing capability");
            return;
          }
          
          // Check if enable method exists
          if (typeof (e.layer as any).editing.enable !== 'function') {
            console.warn("Layer editing.enable is not a function");
            // Create a dummy enable function to prevent errors
            (e.layer as any).editing.enable = function() { 
              console.log("Dummy enable called on layer without proper edit capability");
            };
          }
          
          return originalEnableLayerEdit.apply(this, arguments);
        } catch (err) {
          console.error("Error in _enableLayerEdit:", err);
        }
      };
    }
  }
}
