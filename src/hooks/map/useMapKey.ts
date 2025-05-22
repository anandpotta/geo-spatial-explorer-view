
import { useState } from 'react';

export function useMapKey() {
  const [mapKey, setMapKey] = useState<number>(Date.now());
  const [mapReady, setMapReady] = useState(false);
  
  const regenerateMapKey = () => {
    setMapKey(Date.now());
    setMapReady(false);
  };

  return {
    mapKey,
    mapReady,
    setMapReady,
    regenerateMapKey
  };
}
