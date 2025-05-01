
import L from 'leaflet';

/**
 * Prepares a layer for display with necessary styling options
 */
export function prepareLayerStyle(layer: L.Layer): void {
  if (layer.options) {
    // Use type assertion to tell TypeScript these properties exist
    const options = layer.options as L.PathOptions;
    options.renderer = L.svg();
    options.fillOpacity = 0.5; // Ensure fill opacity is set
    options.opacity = 1; // Ensure stroke opacity is set
    options.weight = 3; // Ensure stroke width is visible
    options.color = '#3388ff'; // Ensure color is set
    // Ensure interactive is set
    options.interactive = true;
  }
}

/**
 * Ensure layer visibility by setting appropriate styles on the SVG path element
 */
export function ensurePathVisibility(layer: L.Layer): void {
  if ((layer as any)._path) {
    (layer as any)._path.style.visibility = 'visible';
    (layer as any)._path.style.display = 'block';
    (layer as any)._path.style.opacity = '1';
    (layer as any)._path.style.fillOpacity = '0.5';
    (layer as any)._path.style.pointerEvents = 'auto';
  }
}

/**
 * Add interactivity class to layer path
 */
export function addInteractiveClass(layer: L.Layer): void {
  if ((layer as any)._path) {
    (layer as any)._path.classList.add('leaflet-interactive');
  }
}
