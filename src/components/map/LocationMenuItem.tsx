
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MapPin, Trash2 } from "lucide-react";
import { LocationMarker } from '@/utils/geo-utils';

interface LocationMenuItemProps {
  marker: LocationMarker;
  onSelect: (position: [number, number]) => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
}

const LocationMenuItem = ({ marker, onSelect, onDelete }: LocationMenuItemProps) => {
  return (
    <DropdownMenuItem className="flex justify-between items-center">
      <div
        className="flex items-center flex-1 cursor-pointer"
        onClick={() => onSelect(marker.position)}
      >
        <MapPin className="mr-2 h-4 w-4" />
        {marker.name}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => onDelete(marker.id, e)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </DropdownMenuItem>
  );
};

export default LocationMenuItem;
