
import { useState, useEffect } from 'react';
import { LocationMarker, getSavedMarkers, deleteMarker } from '@/utils/geo-utils';
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
import { Navigation, MapPin, Trash2 } from "lucide-react";
import { toast } from 'sonner';

interface SavedLocationsDropdownProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsDropdown = ({ onLocationSelect }: SavedLocationsDropdownProps) => {
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [pinnedMarkers, setPinnedMarkers] = useState<LocationMarker[]>([]);

  const loadMarkers = () => {
    const savedMarkers = getSavedMarkers();
    setMarkers(savedMarkers);
    const pinned = savedMarkers.filter(marker => marker.isPinned === true);
    setPinnedMarkers(pinned);
  };

  useEffect(() => {
    loadMarkers();
    window.addEventListener('storage', loadMarkers);
    return () => window.removeEventListener('storage', loadMarkers);
  }, []);

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent dropdown from closing
    deleteMarker(id);
    loadMarkers();
    toast.success("Location removed");
  };

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
                  className="flex justify-between items-center"
                >
                  <div
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => onLocationSelect(marker.position)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {marker.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleDelete(marker.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                className="flex justify-between items-center"
              >
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => onLocationSelect(marker.position)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {marker.name}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => handleDelete(marker.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SavedLocationsDropdown;
