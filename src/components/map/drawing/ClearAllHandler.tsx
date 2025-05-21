
import { toast } from 'sonner';
import { 
  clearSvgPaths,
  clearAllMarkers,
  clearAllDrawings,
  preserveAuthData,
  forceMapRefresh
} from '@/utils/clear-operations';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    try {
      // Clear all visible layers from the map
      featureGroup.clearLayers();
      
      // Clear SVG paths
      clearSvgPaths();
      
      // Clear markers
      clearAllMarkers();
      
      // Preserve authentication data and get restore function
      const restoreAuth = preserveAuthData();
      
      // Clear everything from localStorage
      localStorage.clear();
      
      // Restore authentication data
      restoreAuth();
      
      // Clear drawings
      clearAllDrawings();
      
      // Force map refresh
      forceMapRefresh();
      
      // Call the callback if provided
      if (onClearAll) {
        onClearAll();
      }
      
      // Show success message
      toast.success('All map data cleared while preserving user accounts');
    } catch (error) {
      console.error('Error in clear all operation:', error);
      toast.error('Error clearing map data');
    }
  }
}
