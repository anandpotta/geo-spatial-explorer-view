
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * This component ensures the _leaflet_pos property is properly set
 * It runs once the map is ready
 */
const MapPosHandler = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    console.log('MapPosHandler: Setting up _leaflet_pos');
    
    try {
      // Manually check and set _leaflet_pos if missing
      const mapPane = map.getPane('mapPane');
      if (mapPane && !(mapPane as any)._leaflet_pos) {
        console.log('Creating missing _leaflet_pos in MapPosHandler');
        (mapPane as any)._leaflet_pos = { x: 0, y: 0 };
      }
      
      // Also check internal panes structure
      if ((map as any)._panes && (map as any)._panes.mapPane && !(map as any)._panes.mapPane._leaflet_pos) {
        console.log('Creating missing _leaflet_pos on _panes.mapPane in MapPosHandler');
        (map as any)._panes.mapPane._leaflet_pos = { x: 0, y: 0 };
      }
    } catch (err) {
      console.warn('Error in MapPosHandler:', err);
    }
  }, [map]);
  
  return null;
};

export default MapPosHandler;
