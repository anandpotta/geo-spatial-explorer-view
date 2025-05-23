
import React, { useState } from 'react';
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
  const [showTooltip, setShowTooltip] = useState(true);
  
  // Truncate label to max 24 characters
  const truncatedLabel = label.length > 24 ? `${label.substring(0, 24)}...` : label;
  
  const handleCloseTooltip = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Access the native event to call stopImmediatePropagation
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    console.log('Close tooltip clicked');
    setShowTooltip(false);
  };

  const handleRemoveMarker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Access the native event to call stopImmediatePropagation
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
    console.log('Remove marker clicked');
    if (onClose) {
      onClose();
    }
  };

  const handleMarkerMouseOver = () => {
    if (!showTooltip) {
      setShowTooltip(true);
    }
  };
  
  return (
    <Marker 
      position={position} 
      icon={redMarkerIcon}
      draggable={false}
      title={label}
      eventHandlers={{
        mouseover: handleMarkerMouseOver
      }}
    >
      {showTooltip && (
        <Tooltip permanent direction="top" offset={[0, -40]} className="selected-location-tooltip">
          <div className="flex items-center gap-1 px-2 py-1 bg-white rounded shadow-md border text-xs">
            <span className="text-gray-800 font-medium location-text" title={label}>
              {truncatedLabel}
            </span>
            <button
              onMouseDown={handleCloseTooltip}
              onClick={handleCloseTooltip}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors ml-1 cursor-pointer z-50"
              title="Close tooltip"
              style={{ pointerEvents: 'auto' }}
            >
              <X size={10} className="text-gray-500" />
            </button>
            {onClose && (
              <button
                onMouseDown={handleRemoveMarker}
                onClick={handleRemoveMarker}
                className="p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer z-50"
                title="Remove marker"
                style={{ pointerEvents: 'auto' }}
              >
                <X size={10} className="text-red-500" />
              </button>
            )}
          </div>
        </Tooltip>
      )}
    </Marker>
  );
};

export default SelectedLocationMarker;
