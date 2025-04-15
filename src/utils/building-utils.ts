
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Type definitions for building data
export interface Building {
  id: string;
  name: string;
  type: string; // polygon, rectangle, circle, etc.
  geoJSON: any; // GeoJSON representation of the building
  locationKey: string; // A unique key for the location (lat_long)
  location: {
    x: number;
    y: number;
    label: string;
  };
  createdAt: Date;
}

// Save a building to localStorage
export const saveBuilding = (building: Building): void => {
  try {
    // Ensure building has an ID
    if (!building.id) {
      building.id = uuidv4();
    }
    
    // Ensure createdAt is a Date object
    if (!(building.createdAt instanceof Date)) {
      building.createdAt = new Date();
    }
    
    // Ensure the locationKey exists
    if (!building.locationKey) {
      building.locationKey = `${building.location.x.toFixed(4)}_${building.location.y.toFixed(4)}`;
    }
    
    // Get existing buildings
    const buildings = getSavedBuildings();
    
    // Add the new building
    buildings.push(building);
    
    // Save to localStorage
    localStorage.setItem('savedBuildings', JSON.stringify(buildings));
    
    console.log(`Building saved: ${building.name} at ${building.locationKey}`);
  } catch (error) {
    console.error('Error saving building:', error);
    toast.error('Failed to save building');
  }
};

// Get all saved buildings
export const getAllSavedBuildings = (): Building[] => {
  try {
    const buildingsJson = localStorage.getItem('savedBuildings');
    if (!buildingsJson) return [];
    
    const buildings = JSON.parse(buildingsJson);
    
    // Convert createdAt strings back to Date objects
    return buildings.map((building: any) => ({
      ...building,
      createdAt: new Date(building.createdAt)
    }));
  } catch (error) {
    console.error('Error loading buildings:', error);
    toast.error('Failed to load buildings');
    return [];
  }
};

// Get buildings for a specific location
export const getSavedBuildings = (locationKey?: string): Building[] => {
  const allBuildings = getAllSavedBuildings();
  
  if (!locationKey) return allBuildings;
  
  // Filter buildings by locationKey
  return allBuildings.filter(building => building.locationKey === locationKey);
};

// Delete a building
export const deleteBuilding = (id: string): void => {
  try {
    const buildings = getAllSavedBuildings();
    const filteredBuildings = buildings.filter(building => building.id !== id);
    
    localStorage.setItem('savedBuildings', JSON.stringify(filteredBuildings));
    toast.success('Building deleted');
  } catch (error) {
    console.error('Error deleting building:', error);
    toast.error('Failed to delete building');
  }
};

// Get buildings count by location
export const getBuildingCountByLocation = (): Record<string, number> => {
  const buildings = getAllSavedBuildings();
  const counts: Record<string, number> = {};
  
  buildings.forEach(building => {
    if (!counts[building.locationKey]) {
      counts[building.locationKey] = 0;
    }
    counts[building.locationKey]++;
  });
  
  return counts;
};
