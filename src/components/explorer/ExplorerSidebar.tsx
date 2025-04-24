
import React from 'react';
import { Location } from '@/utils/geo-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Globe2, Map as MapIcon, Bookmark, Maximize, Minimize } from 'lucide-react';
import SavedLocations from '../saved-locations/SavedLocations';
import { useSidebar } from '@/components/ui/sidebar';

interface ExplorerSidebarProps {
  selectedLocation: Location | undefined;
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
  const { state, toggleSidebar } = useSidebar();

  return (
    <div className="w-96 h-full bg-card border-r overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">GeoSpatial Explorer</h1>
          <p className="text-muted-foreground">Search, navigate and mark locations</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="ml-2"
        >
          {state === 'collapsed' ? <Maximize size={18} /> : <Minimize size={18} />}
        </Button>
      </div>
      
      <Tabs defaultValue="search" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">
              <MapIcon size={16} className="mr-2" /> Search
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">
              <Bookmark size={16} className="mr-2" /> Saved
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="search" className="flex-1 p-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Location Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a location to search. The map will navigate from space to your destination.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter a location..."
                    className="w-full p-2 border rounded"
                    onChange={(e) => {
                      // This is just a placeholder UI element
                      // The actual search is handled by the LocationSearch component
                    }}
                  />
                  <Button 
                    size="sm"
                    className="absolute right-1 top-1"
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Current View</h3>
                <div className="flex gap-2">
                  <Button
                    variant={currentView === 'cesium' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrentView('cesium')}
                  >
                    <Globe2 size={16} className="mr-2" /> 3D Globe
                  </Button>
                  <Button
                    variant={currentView === 'leaflet' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setCurrentView('leaflet')}
                    disabled={!flyCompleted && !selectedLocation}
                  >
                    <MapIcon size={16} className="mr-2" /> Map View
                  </Button>
                </div>
              </div>
              
              {selectedLocation && (
                <div className="mt-4 p-3 bg-accent rounded-md">
                  <h3 className="font-medium">{selectedLocation.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lat: {selectedLocation.y.toFixed(6)}, Lng: {selectedLocation.x.toFixed(6)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="flex-1 p-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Saved Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <SavedLocations onLocationSelect={onSavedLocationSelect} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExplorerSidebar;
