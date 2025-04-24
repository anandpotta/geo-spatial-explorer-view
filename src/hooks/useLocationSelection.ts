
import { toast } from 'sonner';

export function useLocationSelection() {
  const handleLocationSelect = (position: [number, number], mapRef: React.RefObject<L.Map>) => {
    try {
      if (!mapRef.current || !mapRef.current.getContainer() || 
          !document.body.contains(mapRef.current.getContainer())) return;
      
      mapRef.current.flyTo(position, 18, {
        duration: 2
      });
      
      toast.success("Navigating to saved location");
    } catch (err) {
      console.error('Error flying to selected location:', err);
    }
  };

  return {
    handleLocationSelect
  };
}
