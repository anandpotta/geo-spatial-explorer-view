
import React from 'react';
import { LocationMarker } from "@/utils/marker-utils";
import MarkerMenuItem from "./MarkerMenuItem";

interface LocationsListProps {
  markers: LocationMarker[];
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
}

const LocationsList = ({ markers, onSelect, onDelete }: LocationsListProps) => {
  if (markers.length === 0) {
    return (
      <div className="p-2 text-center text-sm text-muted-foreground">
        No saved locations yet
      </div>
    );
  }

  return (
    <div className="max-h-[200px] overflow-y-auto">
      {markers.map((marker) => (
        <MarkerMenuItem
          key={marker.id}
          marker={marker}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default LocationsList;
