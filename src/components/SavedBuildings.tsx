
import { useState, useEffect } from 'react';
import { Building, getAllSavedBuildings, deleteBuilding } from '@/utils/building-utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Trash2, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SavedBuildingsProps {
  onBuildingSelect: (building: { id: string, name: string, x: number, y: number, label: string }) => void;
}

const SavedBuildings = ({ onBuildingSelect }: SavedBuildingsProps) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locationGroups, setLocationGroups] = useState<Record<string, Building[]>>({});
  
  useEffect(() => {
    loadBuildings();
  }, []);
  
  const loadBuildings = () => {
    const savedBuildings = getAllSavedBuildings();
    setBuildings(savedBuildings);
    
    // Group buildings by location
    const groups: Record<string, Building[]> = {};
    savedBuildings.forEach(building => {
      if (!groups[building.locationKey]) {
        groups[building.locationKey] = [];
      }
      groups[building.locationKey].push(building);
    });
    
    setLocationGroups(groups);
  };
  
  const handleDelete = (id: string) => {
    deleteBuilding(id);
    loadBuildings();
  };
  
  const handleSelect = (building: Building) => {
    onBuildingSelect({
      id: building.id,
      name: building.name,
      x: building.location.x,
      y: building.location.y,
      label: building.location.label
    });
  };
  
  if (buildings.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No saved buildings yet</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4 p-2">
        {Object.entries(locationGroups).map(([locationKey, buildingsGroup]) => (
          <div key={locationKey} className="space-y-2 bg-muted/50 p-2 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center">
                  <MapPin size={14} />
                </div>
                <h3 className="font-medium text-sm">{buildingsGroup[0].location.label}</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSelect(buildingsGroup[0])}
              >
                View
              </Button>
            </div>
            
            <div className="pl-4 space-y-1">
              {buildingsGroup.map(building => (
                <div 
                  key={building.id}
                  className="flex items-center justify-between p-1.5 bg-accent/50 rounded-sm"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={14} />
                    <div>
                      <p className="text-xs font-medium">{building.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(building.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleSelect(building)}
                    >
                      <MapPin size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(building.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SavedBuildings;
