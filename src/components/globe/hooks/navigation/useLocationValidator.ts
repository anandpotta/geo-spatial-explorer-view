
import { useCallback } from 'react';
import { Location } from '@/utils/geo-utils';
import { toast } from '@/components/ui/use-toast';

/**
 * Custom hook to validate location coordinates
 */
export function useLocationValidator() {
  // Validate location coordinates
  const validateLocation = useCallback((location: Location | undefined): boolean => {
    if (!location) return false;
    
    // Validate the coordinates
    if (typeof location.x !== 'number' || 
        typeof location.y !== 'number' ||
        isNaN(location.x) || 
        isNaN(location.y)) {
      console.error("Invalid coordinates for location:", location);
      toast({
        title: "Navigation Error",
        description: "Invalid coordinates provided",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, []);

  return {
    validateLocation
  };
}
