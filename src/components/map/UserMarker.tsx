
import { useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { LocationMarker } from '@/utils/marker-utils';
import MarkerPopup from './MarkerPopup';

interface UserMarkerProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

const UserMarker = ({ marker, onDelete, onRename }: UserMarkerProps) => {
  // Ensure marker has a unique identifier
  const uniqueId = marker.uniqueId || `marker-${marker.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Ensure marker has userId (required by markers/types.ts)
  const markerWithUserId = {
    ...marker,
    userId: marker.userId || 'default-user'
  };
  
  useEffect(() => {
    console.log(`Rendered user marker with unique ID: ${uniqueId} for marker ID: ${marker.id}`);
  }, [uniqueId, marker.id]);

  // Create custom icon with unique identifier
  const markerIcon = L.divIcon({
    className: 'user-marker-icon',
    html: `<div data-marker-id="${marker.id}" data-unique-id="${uniqueId}" data-marker-type="user" style="
      width: 25px;
      height: 41px;
      background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzMzg4ZmYiLz4KPHBhdGggZD0iTTEyLjUgNEM5LjQ2MjQzIDQgNyA2LjQ2MjQzIDcgOS41QzcgMTIuNTM3NiA5LjQ2MjQzIDE1IDEyLjUgMTVDMTUuNTM3NiAxNSAxOCAxMi41Mzc2IDE4IDkuNUMxOCA2LjQ2MjQzIDE1LjUzNzYgNCAxMi41IDRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K') no-repeat center;
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
      position={marker.position} 
      icon={markerIcon}
      // Add unique identifier as a custom property
      ref={(markerRef) => {
        if (markerRef) {
          (markerRef as any).uniqueId = uniqueId;
          (markerRef as any).markerId = marker.id;
          (markerRef as any).markerType = 'user';
        }
      }}
    >
      <Popup>
        <MarkerPopup 
          marker={markerWithUserId} 
          onDelete={onDelete} 
          onRename={onRename || (() => {})} 
        />
      </Popup>
    </Marker>
  );
};

export default UserMarker;
