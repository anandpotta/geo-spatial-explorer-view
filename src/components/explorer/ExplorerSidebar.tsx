
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Map, Layers, UserRoundSearch } from 'lucide-react';
import { Location } from '@/utils/geo-utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import SavedLocations from '../SavedLocations';
import SavedBuildings from '../SavedBuildings';

interface ExplorerSidebarProps {
  selectedLocation?: Location;
  currentView: 'cesium' | 'leaflet';
  flyCompleted: boolean;
  setCurrentView: (view: 'cesium' | 'leaflet') => void;
  onSavedLocationSelect: (position: [number, number]) => void;
}

const ExplorerSidebar = ({ 
  selectedLocation, 
  currentView, 
  flyCompleted, 
  setCurrentView,
  onSavedLocationSelect 
}: ExplorerSidebarProps) => {
  const [tab, setTab] = useState<string>("locations");
  
  const handleMapViewToggle = (view: 'cesium' | 'leaflet') => {
    setCurrentView(view);
  };
  
  const handleBuildingSelect = (location: { x: number, y: number, label: string }) => {
    // Create a Location object from the building location
    const locationObj: Location = {
      id: `loc-${location.x}-${location.y}`,
      label: location.label,
      x: location.x,
      y: location.y
    };
    
    // Similar to onSavedLocationSelect, but with the Location object
    onSavedLocationSelect([location.y, location.x]);
  };
  
  return (
    <div className="w-80 bg-background border-r border-border flex flex-col shrink-0 h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">GeoSpatial Explorer</h1>
        <p className="text-muted-foreground text-sm">3D mapping and annotation</p>
      </div>
      
      {/* MapView Toggle */}
      <div className="p-4 border-b">
        <div className="flex space-x-2">
          <Button
            variant={currentView === 'cesium' ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => handleMapViewToggle('cesium')}
          >
            <Map className="mr-1 h-4 w-4" />
            3D View
          </Button>
          <Button
            variant={currentView === 'leaflet' ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => handleMapViewToggle('leaflet')}
          >
            <Layers className="mr-1 h-4 w-4" />
            Drawing
          </Button>
        </div>
      </div>
      
      {/* Location Info */}
      {selectedLocation && (
        <div className="p-4 border-b">
          <h2 className="text-sm font-medium mb-1">Selected Location</h2>
          <p className="text-sm font-semibold">{selectedLocation.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedLocation.y.toFixed(6)}, {selectedLocation.x.toFixed(6)}
          </p>
        </div>
      )}
      
      {/* Tabs for different saved items */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue={tab} value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="locations" className="flex-1">
                <MapPin className="mr-1 h-4 w-4" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="buildings" className="flex-1">
                <Building2 className="mr-1 h-4 w-4" />
                Buildings
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="locations" className="flex-1 pt-4 px-2 overflow-hidden">
            <SavedLocations onLocationSelect={onSavedLocationSelect} />
          </TabsContent>
          
          <TabsContent value="buildings" className="flex-1 pt-4 px-2 overflow-hidden">
            <SavedBuildings onBuildingSelect={handleBuildingSelect} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Search Prompt */}
      <div className="p-4 bg-muted/50 border-t">
        <div className="flex items-center text-sm text-muted-foreground">
          <UserRoundSearch className="h-5 w-5 mr-2" />
          <p>Search for a location to start exploring</p>
        </div>
      </div>
    </div>
  );
};

export default ExplorerSidebar;
