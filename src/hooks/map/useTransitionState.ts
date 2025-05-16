
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Location } from '@/utils/geo-utils';

export function useTransitionState(
  currentView: 'cesium' | 'leaflet',
  selectedLocation?: Location
) {
  const [viewTransitionInProgress, setViewTransitionInProgress] = useState(false);
  
  const startTransition = () => {
    setViewTransitionInProgress(true);
  };
  
  const endTransition = () => {
    setViewTransitionInProgress(false);
  };
  
  const showViewReadyToast = () => {
    if (!viewTransitionInProgress) {
      if (currentView === 'cesium') {
        toast({
          title: "3D Globe Ready",
          description: "Interactive 3D globe view has been loaded.",
          variant: "default",
          duration: 2000,
        });
      } else if (currentView === 'leaflet') {
        if (selectedLocation) {
          toast({
            title: "Map View Ready",
            description: `Showing ${selectedLocation.label}`,
            variant: "default",
            duration: 2000,
          });
        } else {
          toast({
            title: "Map View Ready",
            variant: "default",
            duration: 1500,
          });
        }
      }
    }
  };

  return {
    viewTransitionInProgress,
    startTransition,
    endTransition,
    showViewReadyToast
  };
}
