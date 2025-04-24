
import { useCallback, useRef, useState } from 'react';
import L from 'leaflet';
import { toast } from 'sonner';

export const useLeafletMapInitialization = () => {
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [mapReadyAttempts, setMapReadyAttempts] = useState<number>(0);
  const cleanupInProgress = useRef<boolean>(false);
  const mapInitializedSuccessfully = useRef<boolean>(false);
  const mapContainerId = useRef<string>(`map-container-${mapInstanceKey}-${Math.random().toString(36).substring(2, 9)}`);

  const resetMap = useCallback(() => {
    const newKey = Date.now();
    setMapInstanceKey(newKey);
    mapContainerId.current = `map-container-${newKey}-${Math.random().toString(36).substring(2, 9)}`;
    setIsMapInitialized(false);
    setMapReadyAttempts(0);
  }, []);

  return {
    mapRef,
    mapInstanceKey,
    isMapInitialized,
    mapReadyAttempts,
    cleanupInProgress,
    mapInitializedSuccessfully,
    mapContainerId,
    setMapInstanceKey,
    setIsMapInitialized,
    setMapReadyAttempts,
    resetMap
  };
};
