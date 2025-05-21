
import { useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';

export function useMapInitializer(
  mapInstanceKey: number,
  mapAttachedRef: React.MutableRefObject<boolean>,
  validityChecksRef: React.MutableRefObject<number>,
  recoveryAttemptRef: React.MutableRefObject<number>,
  initialFlyComplete: React.MutableRefObject<boolean>,
  setIsMapReady: (ready: boolean) => void
) {
  useEffect(() => {
    setupLeafletIcons();
    mapAttachedRef.current = false;
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
    initialFlyComplete.current = false;
    
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Reset map ready state when key changes
    setIsMapReady(false);
  }, [mapInstanceKey, mapAttachedRef, validityChecksRef, recoveryAttemptRef, initialFlyComplete, setIsMapReady]);
}
