
import React from 'react';
import { LocationMarker } from "@/utils/marker-utils";
import MarkerMenuItem from "./MarkerMenuItem";
import { SidebarMenu } from "@/components/ui/sidebar";

interface LocationsListProps {
  markers: LocationMarker[];
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
}

const LocationsList = ({ markers, onSelect, onDelete }: LocationsListProps) => {
  return (
    <>
      {markers.map((marker) => (
        <MarkerMenuItem
          key={marker.id}
          marker={marker}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default LocationsList;
