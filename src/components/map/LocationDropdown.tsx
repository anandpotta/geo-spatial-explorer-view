
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { ChevronDown, MapPin } from 'lucide-react';
import { getAllSavedBuildings, Building } from '@/utils/building-utils';

interface LocationDropdownProps {
  onSelect: (building: Building) => void;
}

const LocationDropdown = ({ onSelect }: LocationDropdownProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    const loadBuildings = () => {
      const savedBuildings = getAllSavedBuildings();
      setBuildings(savedBuildings);
    };

    loadBuildings();
    // Refresh the list when the component mounts
    const interval = setInterval(loadBuildings, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-48">
          <MapPin className="mr-2 h-4 w-4" />
          Saved Locations
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {buildings.length === 0 ? (
          <DropdownMenuItem disabled>
            No saved locations
          </DropdownMenuItem>
        ) : (
          buildings.map((building) => (
            <DropdownMenuItem
              key={building.id}
              onClick={() => onSelect(building)}
            >
              {building.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LocationDropdown;
