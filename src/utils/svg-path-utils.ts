
// Re-export all SVG path utilities from their respective modules
export { extractSvgPaths } from './svg-path/extraction';
export { clearAllMapSvgElements } from './svg-path/cleanup';
export { serializeSvgPath, deserializeSvgPath } from './svg-path/serialization';
export { addSvgPathToMap, restoreSvgPaths } from './svg-path/manipulation';
