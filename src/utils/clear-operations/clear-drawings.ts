
/**
 * Clears all drawings from storage and notifies components
 */
export function clearAllDrawings(): void {
  // Remove drawings from storage
  localStorage.removeItem('savedDrawings');
  localStorage.removeItem('svgPaths');
  
  // Dispatch events to notify components
  window.dispatchEvent(new Event('drawingsUpdated'));
  console.log('All drawings cleared');
}

/**
 * Ensures drawing tools are re-initialized after view change
 */
export function resetDrawingTools(): void {
  // Notify drawing tool components to reinitialize
  window.dispatchEvent(new Event('resetDrawingTools'));
}
