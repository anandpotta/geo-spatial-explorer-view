
import { MapContainer, TileLayer, AttributionControl } from 'react-leaflet';
import L from 'leaflet';

interface MapContainerProps {
  position: [number, number];
  zoom: number;
  uniqueMapId: string;
  onMapReady: (map: L.Map) => void;
  children: React.ReactNode;
}

const MapCore = ({
  position,
  zoom,
  uniqueMapId,
  onMapReady,
  children
}: MapContainerProps) => {
  return (
    <MapContainer 
      id={uniqueMapId}
      className="w-full h-full"
      attributionControl={false}
      center={position}
      zoom={zoom}
      zoomControl={false}
      fadeAnimation={true}
      markerZoomAnimation={true}
      preferCanvas={true}
      key={uniqueMapId}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        maxZoom={19}
        subdomains={['a', 'b', 'c']}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="leaflet-tile-pane"
      />
      <AttributionControl position="bottomright" prefix={false} />
      
      {children}
    </MapContainer>
  );
};

export default MapCore;
