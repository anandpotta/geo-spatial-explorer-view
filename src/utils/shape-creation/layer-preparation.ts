
import L from 'leaflet';

/**
 * Prepares a layer for display with necessary styling options
 */
export function prepareLayerStyle(layer: L.Layer): void {
  if (layer.options) {
    layer.options.renderer = L.svg();
    layer.options.fillOpacity = 0.5; // Ensure fill opacity is set
    layer.options.opacity = 1; // Ensure stroke opacity is set
    layer.options.weight = 3; // Ensure stroke width is visible
    layer.options.color = '#3388ff'; // Ensure color is set
    // Ensure interactive is set
    layer.options.interactive = true;
  }
}

/**
 * Ensure layer visibility by setting appropriate styles on the SVG path element
 */
export function ensurePathVisibility(layer: L.Layer): void {
  if (layer._path) {
    layer._path.style.visibility = 'visible';
    layer._path.style.display = 'block';
    layer._path.style.opacity = '1';
    layer._path.style.fillOpacity = '0.5';
    layer._path.style.pointerEvents = 'auto';
  }
}

/**
 * Add interactivity class to layer path
 */
export function addInteractiveClass(layer: L.Layer): void {
  if (layer._path) {
    layer._path.classList.add('leaflet-interactive');
  }
}
