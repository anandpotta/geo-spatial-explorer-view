
/**
 * Clears all SVG paths from storage and memory
 */
export function clearSvgPaths(): void {
  // Remove SVG paths from storage
  localStorage.removeItem('svgPaths');
  
  // Dispatch an event for components to clear their paths
  window.dispatchEvent(new CustomEvent('clearAllSvgPaths'));
  console.log('SVG paths cleared');
}
