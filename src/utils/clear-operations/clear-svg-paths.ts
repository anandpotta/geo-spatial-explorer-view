
import { toast } from 'sonner';

/**
 * Clears all SVG paths from the application
 */
export function clearSvgPaths() {
  try {
    // Force SVG paths to be removed by triggering all relevant events
    window.dispatchEvent(new Event('clearAllSvgPaths'));
    
    // Clear SVG paths from storage
    localStorage.removeItem('svgPaths');
    
    return true;
  } catch (error) {
    console.error('Error clearing SVG paths:', error);
    return false;
  }
}
