
import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { X } from 'lucide-react';
import './SelectedLocationMarker.css';

interface SelectedLocationMarkerProps {
  position: [number, number];
  label: string;
  onClose?: () => void;
}

// Create a red marker icon for selected locations
const redMarkerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SelectedLocationMarker = ({ position, label, onClose }: SelectedLocationMarkerProps) => {
  const [lat, lng] = position;
  
  return (
    <Marker 
      position={position} 
      icon={redMarkerIcon}
      draggable={false}
      title={label}
    >
      <Tooltip permanent direction="top" offset={[0, -40]} className="selected-location-tooltip">
        <div className="flex items-center gap-2 p-2 bg-white rounded shadow-lg border">
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-800">{label}</div>
            <div className="text-xs text-gray-600">
              Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Remove marker"
            >
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
};

export default SelectedLocationMarker;
