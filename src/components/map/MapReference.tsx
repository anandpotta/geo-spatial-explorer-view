
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapContainer } from '@/hooks/map/useMapContainer';
import { useMapInitialization } from '@/hooks/map/useMapInitialization';
import { useMapCleanup } from '@/hooks/map/useMapCleanup';

interface MapReferenceProps {
  onMapReady: (map: L.Map) => void;
}

const MapReference = ({ onMapReady }: MapReferenceProps) => {
  const map = useMap();
  const hasCalledOnReady = useRef(false);
  const initTimeoutRef = useRef<number | null>(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const maxAttempts = 20;
  
  const { isContainerValid, ensureContainerVisibility } = useMapContainer();
  useMapInitialization({ map, hasCalledOnReady });
  useMapCleanup(map, initTimeoutRef);

  useEffect(() => {
    if (!map || hasCalledOnReady.current) return;
    
    console.log('Map is ready in MapReference');
    
    const safeInit = () => {
      try {
        if (initAttempts >= maxAttempts) {
          console.warn('Maximum map initialization attempts reached. Proceeding with limited functionality.');
          map.isMapFullyInitialized = true;
          hasCalledOnReady.current = true;
          onMapReady(map);
          return;
        }

        ensureContainerVisibility(map);

        if (!isContainerValid(map)) {
          console.log('Map container not ready, retrying... (attempt ' + (initAttempts + 1) + ')');
          setInitAttempts(prev => prev + 1);
          initTimeoutRef.current = window.setTimeout(safeInit, 300);
          return;
        }

        map.invalidateSize(true);
        
        setTimeout(() => {
          if (!map || !isContainerValid(map)) {
            setInitAttempts(prev => prev + 1);
            initTimeoutRef.current = window.setTimeout(safeInit, 300);
            return;
          }

          const mapPane = map.getContainer().querySelector('.leaflet-map-pane');
          if (!mapPane) {
            setInitAttempts(prev => prev + 1);
            initTimeoutRef.current = window.setTimeout(safeInit, 300);
            return;
          }

          map.invalidateSize(true);

          if (isContainerValid(map)) {
            map.isMapFullyInitialized = true;
            hasCalledOnReady.current = true;

            if (!map.hasMapClickHandler) {
              map.on('click', (e) => {
                console.log('Map was clicked at:', e.latlng);
              });
              map.hasMapClickHandler = true;
            }

            onMapReady(map);
            console.log('Map fully initialized and ready');
          }
        }, 150);
      } catch (err) {
        console.error('Error in map initialization, retrying:', err);
        setInitAttempts(prev => prev + 1);
        initTimeoutRef.current = window.setTimeout(safeInit, 300);
      }
    };

    initTimeoutRef.current = window.setTimeout(safeInit, 100);
  }, [map, onMapReady, initAttempts, isContainerValid, ensureContainerVisibility]);

  return null;
};

export default MapReference;
