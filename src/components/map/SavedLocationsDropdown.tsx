import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers } from '@/utils/marker-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin } from "lucide-react";

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown = ({ onLocationSelect }: SavedLocationsDropdownProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);

  useEffect(() => {
    const loadMarkers = () => {
      const savedMarkers = getSavedMarkers();
      setMarkers(savedMarkers);
      
      // Filter pinned markers
      const pinned = savedMarkers.filter(marker => marker.isPinned === true);
      setPinnedMarkers(pinned);
    };

    loadMarkers();
    // Add event listener for storage changes
    window.addEventListener('storage', loadMarkers);
    return () => window.removeEventListener('storage', loadMarkers);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-[200px]">
          <Navigation className="mr-2 h-4 w-4" />
          Saved Locations
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]">
        {pinnedMarkers.length > 0 && (
          <>
            <DropdownMenuLabel>Pinned Locations</DropdownMenuLabel>
            <DropdownMenuGroup>
              {pinnedMarkers.map((marker) => (
                <DropdownMenuItem
                  key={`pinned-${marker.id}`}
                  onClick={() => onLocationSelect(marker.position)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {marker.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>All Locations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {markers.length === 0 ? (
            <DropdownMenuItem disabled>No saved locations</DropdownMenuItem>
          ) : (
            markers.map((marker) => (
              <DropdownMenuItem
                key={marker.id}
                onClick={() => onLocationSelect(marker.position)}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {marker.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SavedLocationsDropdown;
