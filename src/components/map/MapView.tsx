
import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import MapEvents from './MapEvents';
import MapReference from './MapReference';
import MarkersContainer from './marker/MarkersContainer';
import 'leaflet/dist/leaflet.css';
import { LocationMarker } from '@/utils/geo-utils';

interface MapViewProps {
  position: [number, number];
  zoom: number;
  markers: LocationMarker[];
  tempMarker: [number, number] | null;
  markerName: string;
  markerType: 'pin' | 'area' | 'building';
  onMapReady: (map: L.Map) => void;
  onSaveMarker: () => void;
  onDeleteMarker: (id: string) => void;
  onRenameMarker: (id: string, newName: string) => void;
  setMarkerName: (name: string) => void;
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  setTempMarker: (pos: [number, number] | null) => void;
}

const MapView = ({
  position,
  zoom,
  markers,
  tempMarker,
  markerName,
  markerType,
  onMapReady,
  onSaveMarker,
  onDeleteMarker,
  onRenameMarker,
  setMarkerName,
  setMarkerType,
  setTempMarker
}: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Clean up any stale map elements when the component unmounts
  useEffect(() => {
    return () => {
      console.log("MapView is unmounting - cleaning up any stale map elements");
      const container = containerRef.current;
      if (container) {
        console.log("Found container, cleaning up child elements");
        // Remove all event listeners
        const mapClone = container.cloneNode(true);
        if (container.parentNode) {
          container.parentNode.replaceChild(mapClone, container);
        }
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-gray-100 relative"
      data-testid="map-view"
    >
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        zoomControl={false}
        doubleClickZoom={false}
      >
        <MapReference onMapReady={onMapReady} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents setTempMarker={setTempMarker} />
        <MarkersContainer
          markers={markers}
          tempMarker={tempMarker}
          markerName={markerName}
          markerType={markerType}
          onDeleteMarker={onDeleteMarker}
          onRenameMarker={onRenameMarker}
          onSaveMarker={onSaveMarker}
          setMarkerName={setMarkerName}
          setMarkerType={setMarkerType}
        />
      </MapContainer>
    </div>
  );
};

export default MapView;
