
import { useState, useCallback } from 'react';

export function useMapKey() {
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [mapReady, setMapReady] = useState(false);
  
  const regenerateMapKey = useCallback(() => {
    console.log('Regenerating map key');
    setMapKey(Date.now());
    setMapReady(false);
  }, []);

  return {
    mapKey,
    mapReady,
    setMapReady,
    regenerateMapKey
  };
}
