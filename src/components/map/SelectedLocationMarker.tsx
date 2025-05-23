
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
  return (
    <Marker 
      position={position} 
      icon={redMarkerIcon}
      draggable={false}
      title={label}
    >
      <Tooltip permanent direction="top" offset={[0, -40]} className="selected-location-tooltip">
        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded shadow-md border text-xs">
          <span className="text-gray-800 font-medium">{label}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors ml-1"
              title="Remove marker"
            >
              <X size={10} className="text-gray-500" />
            </button>
          )}
        </div>
      </Tooltip>
    </Marker>
  );
};

export default SelectedLocationMarker;
