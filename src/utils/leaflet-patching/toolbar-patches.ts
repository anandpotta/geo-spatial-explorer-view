
import L from 'leaflet';
import { patchLayerForEdit, patchFeatureGroupLayers } from './layer-patches';

/**
 * Patches the edit toolbar to safely handle layers without edit methods
 */
export const patchEditToolbar = () => {
  try {
    if (!L.EditToolbar || !L.EditToolbar.Edit) return;

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
        if (featureGroup) {
          patchFeatureGroupLayers(featureGroup);
        }
        
        return originalAddHooks.call(this);
      };
    }

    // Patch edit toolbar to properly handle layer detection including markers
    if (editProto && editProto._checkDisabled) {
      const originalCheckDisabled = editProto._checkDisabled;
      editProto._checkDisabled = function() {
        const featureGroup = this.options.featureGroup;
        if (featureGroup) {
          // Check for layers in feature group
          const layers = featureGroup.getLayers();
          if (layers && layers.length > 0) {
            return false; // Enable editing - we have layers
          }
          
          // Check for SVG paths in the map
          const map = featureGroup._map;
          if (map) {
            const container = map.getContainer();
            if (container) {
              const paths = container.querySelectorAll('.leaflet-overlay-pane path');
              if (paths.length > 0) {
                return false; // Enable editing - we have SVG paths
              }
              
              // Check for markers in the map
              const markers = container.querySelectorAll('.leaflet-marker-icon');
              if (markers.length > 0) {
                return false; // Enable editing - we have markers
              }
              
              // Check for any drawn elements or user markers
              const drawnElements = container.querySelectorAll('.leaflet-interactive');
              if (drawnElements.length > 0) {
                return false; // Enable editing - we have interactive elements
              }
            }
          }
          
          // Check if there are any markers in the map's _layers
          if (map && map._layers) {
            const mapLayers = Object.values(map._layers);
            const hasMarkers = mapLayers.some((layer: any) => 
              layer instanceof L.Marker || 
              (layer.options && (layer.options.isMarker || layer.options.isUserMarker))
            );
            if (hasMarkers) {
              return false; // Enable editing - we have markers
            }
          }
        }
        
        // Fall back to original check
        return originalCheckDisabled.apply(this, arguments);
      };
    }
  } catch (error) {
    console.error('Failed to patch edit toolbar:', error);
  }
};

/**
 * Patches the delete toolbar similarly to edit toolbar
 */
export const patchDeleteToolbar = () => {
  try {
    if (!L.EditToolbar || !L.EditToolbar.Delete) return;

    const deleteProto = L.EditToolbar.Delete.prototype as any;
    if (deleteProto && deleteProto._checkDisabled) {
      const originalCheckDisabled = deleteProto._checkDisabled;
      deleteProto._checkDisabled = function() {
        const featureGroup = this.options.featureGroup;
        if (featureGroup) {
          // Check for layers in feature group
          const layers = featureGroup.getLayers();
          if (layers && layers.length > 0) {
            return false; // Enable deleting - we have layers
          }
          
          // Check for SVG paths in the map
          const map = featureGroup._map;
          if (map) {
            const container = map.getContainer();
            if (container) {
              const paths = container.querySelectorAll('.leaflet-overlay-pane path');
              if (paths.length > 0) {
                return false; // Enable deleting - we have SVG paths
              }
              
              // Check for markers in the map
              const markers = container.querySelectorAll('.leaflet-marker-icon');
              if (markers.length > 0) {
                return false; // Enable deleting - we have markers
              }
              
              // Check for any drawn elements or user markers
              const drawnElements = container.querySelectorAll('.leaflet-interactive');
              if (drawnElements.length > 0) {
                return false; // Enable deleting - we have interactive elements
              }
            }
          }
          
          // Check if there are any markers in the map's _layers
          if (map && map._layers) {
            const mapLayers = Object.values(map._layers);
            const hasMarkers = mapLayers.some((layer: any) => 
              layer instanceof L.Marker || 
              (layer.options && (layer.options.isMarker || layer.options.isUserMarker))
            );
            if (hasMarkers) {
              return false; // Enable deleting - we have markers
            }
          }
        }
        
        // Fall back to original check
        return originalCheckDisabled.apply(this, arguments);
      };
    }
  } catch (error) {
    console.error('Failed to patch delete toolbar:', error);
  }
};
