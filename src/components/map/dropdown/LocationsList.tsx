
import React from 'react';
import { LocationMarker } from "@/utils/marker-utils";
import MarkerMenuItem from "./MarkerMenuItem";
import { SidebarMenu } from "@/components/ui/sidebar";

interface LocationsListProps {
  markers: LocationMarker[];
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  onRename?: (id: string, event: React.MouseEvent) => void;
}

const LocationsList = ({ markers, onSelect, onDelete, onRename }: LocationsListProps) => {
  return (
    <>
      {markers.map((marker) => (
        <MarkerMenuItem
          key={marker.id}
          marker={marker}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </>
  );
};

export default LocationsList;
