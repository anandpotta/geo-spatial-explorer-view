
import { useRef, useState, useEffect } from 'react';
import L from 'leaflet';
import { setupLeafletIcons } from '@/components/map/LeafletMapIcons';
import { setupMapValidityChecks } from '@/utils/map-validation-utils';
import { useMapReferenceHandler } from '@/hooks/useMapReferenceHandler';

export function useMapInitialization(selectedLocation?: { x: number, y: number }) {
  // State refs
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState<number>(Date.now());
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Tracking refs
  const mapAttachedRef = useRef(false);
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  const initialFlyComplete = useRef(false);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handler for setting map reference
  const handleSetMapRef = useMapReferenceHandler(
    mapRef,
    mapAttachedRef,
    validityChecksRef,
    recoveryAttemptRef,
    initialFlyComplete,
    setIsMapReady,
    selectedLocation
  );

  // Setup and cleanup
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
    
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up Leaflet map instance');
        
        try {
          if (mapRef.current && mapRef.current.remove) {
            try {
              const container = mapRef.current.getContainer();
              if (container && document.body.contains(container)) {
                console.log('Map container exists and is attached - removing map instance');
                mapRef.current.remove();
              }
            } catch (e) {
              console.log('Map container already detached or removed');
            }
          }
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        
        mapRef.current = null;
        mapAttachedRef.current = false;
        setIsMapReady(false);
      }
      
      // Clear validity check interval
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [mapInstanceKey]);

  // Set up map validity checking
  useEffect(() => {
    // Only set up the validation check if needed
    if (isMapReady) return;
    
    const checkMapValidity = setupMapValidityChecks(
      mapRef,
      isMapReady,
      setIsMapReady,
      mapAttachedRef,
      validityChecksRef,
      recoveryAttemptRef
    );
    
    if (!checkMapValidity) return;
    
    // Check validity less frequently (10 seconds) and only when needed
    validityCheckIntervalRef.current = setInterval(checkMapValidity, 10000);
    
    return () => {
      if (validityCheckIntervalRef.current) {
        clearInterval(validityCheckIntervalRef.current);
        validityCheckIntervalRef.current = null;
      }
    };
  }, [isMapReady]);

  return {
    mapRef,
    mapInstanceKey,
    isMapReady,
    setIsMapReady,
    setMapInstanceKey,
    handleSetMapRef,
  };
}
