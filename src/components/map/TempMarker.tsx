
import { useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

interface TempMarkerProps {
  position: [number, number];
}

const TempMarker = ({ position }: TempMarkerProps) => {
  // Generate unique identifier for this temporary marker
  const uniqueId = `temp-marker-${position[0]}-${position[1]}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  useEffect(() => {
    console.log(`Created temporary marker with unique ID: ${uniqueId} at position:`, position);
  }, [uniqueId, position]);

  // Create custom icon for temporary marker with unique identifier
  const tempIcon = L.divIcon({
    className: 'temp-marker-icon',
    html: `<div data-temp-marker-id="${uniqueId}" data-marker-type="temporary" style="
      width: 25px;
      height: 41px;
      background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNGRjAwMDAiLz4KPHBhdGggZD0iTTEyLjUgNEM5LjQ2MjQzIDQgNyA2LjQ2MjQzIDcgOS41QzcgMTIuNTM3NiA5LjQ2MjQzIDE1IDEyLjUgMTVDMTUuNTM3NiAxNSAxOCAxMi41Mzc2IDE4IDkuNUMxOCA2LjQ2MjQzIDE1LjUzNzYgNCAxMi41IDRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K') no-repeat center;
      background-size: contain;
    ">
      <span style="display: none;">${uniqueId}</span>
    </div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <Marker 
      position={position} 
      icon={tempIcon}
      // Add unique identifier as a custom property
      ref={(marker) => {
        if (marker) {
          (marker as any).uniqueId = uniqueId;
          (marker as any).markerType = 'temporary';
        }
      }}
    />
  );
};

export default TempMarker;
