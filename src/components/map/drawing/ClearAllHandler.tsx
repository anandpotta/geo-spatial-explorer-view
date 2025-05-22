
import { toast } from 'sonner';
import { clearMapData } from '@/utils/clear-operations/clear-map-refreshes';

interface ClearAllHandlerProps {
  featureGroup: L.FeatureGroup;
  onClearAll?: () => void;
}

export function handleClearAll({ featureGroup, onClearAll }: ClearAllHandlerProps) {
  if (featureGroup) {
    try {
      // Use our centralized clear function
      const success = clearMapData(featureGroup);
      
      // Call the callback if provided
      if (success && onClearAll) {
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
