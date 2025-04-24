
import React from 'react';
import { Location } from '@/utils/geo-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapIcon, Bookmark } from 'lucide-react';
import SidebarHeader from './sidebar/SidebarHeader';
import LocationSearch from './sidebar/LocationSearch';
import SavedLocationsTab from './sidebar/SavedLocationsTab';

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
  return (
    <div className="w-96 h-full bg-card border-r overflow-hidden flex flex-col">
      <SidebarHeader />
      
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
          <LocationSearch
            currentView={currentView}
            flyCompleted={flyCompleted}
            selectedLocation={selectedLocation}
            setCurrentView={setCurrentView}
          />
        </TabsContent>
        
        <TabsContent value="saved" className="flex-1 p-4">
          <SavedLocationsTab onLocationSelect={onSavedLocationSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExplorerSidebar;
