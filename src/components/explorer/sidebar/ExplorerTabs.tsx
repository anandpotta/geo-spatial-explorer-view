
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapIcon, Bookmark } from 'lucide-react';
import LocationSearch from './LocationSearch';
import SavedLocationsTab from './SavedLocationsTab';
import { Location } from '@/utils/geo-utils';

interface ExplorerTabsProps {
  currentView: 'cesium' | 'leaflet';
  flyCompleted: boolean;
  selectedLocation: Location | undefined;
  setCurrentView: (view: 'cesium' | 'leaflet') => void;
  onSavedLocationSelect: (position: [number, number]) => void;
}

const ExplorerTabs = ({
  currentView,
  flyCompleted,
  selectedLocation,
  setCurrentView,
  onSavedLocationSelect,
}: ExplorerTabsProps) => {
  return (
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
  );
};

export default ExplorerTabs;
