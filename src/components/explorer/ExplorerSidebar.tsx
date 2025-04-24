
import React from 'react';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import SidebarHeader from './sidebar/SidebarHeader';
import ExplorerTabs from './sidebar/ExplorerTabs';

const ExplorerSidebar = () => {
  const {
    selectedLocation,
    currentView,
    flyCompleted,
    setCurrentView,
    handleLocationSelect,
  } = useLocationSearch();

  const handleSavedLocationSelect = (position: [number, number]) => {
    const location = {
      id: `loc-${position[0]}-${position[1]}`,
      label: `Location at ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`,
      y: position[0],
      x: position[1]
    };
    handleLocationSelect(location);
  };

  return (
    <div className="w-96 h-full bg-card border-r overflow-hidden flex flex-col">
      <SidebarHeader />
      <ExplorerTabs
        currentView={currentView}
        flyCompleted={flyCompleted}
        selectedLocation={selectedLocation}
        setCurrentView={setCurrentView}
        onSavedLocationSelect={handleSavedLocationSelect}
      />
    </div>
  );
};

export default ExplorerSidebar;
