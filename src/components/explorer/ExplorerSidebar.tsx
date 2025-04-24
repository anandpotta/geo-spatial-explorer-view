
import React from 'react';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import SidebarHeader from './sidebar/SidebarHeader';
import ExplorerTabs from './sidebar/ExplorerTabs';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const ExplorerSidebar = () => {
  const { state } = useSidebar();
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
    <div className={cn(
      "h-full bg-card border-r overflow-hidden flex flex-col transition-all duration-300",
      state === "expanded" ? "w-96" : "w-16"
    )}>
      <SidebarHeader />
      <div className={cn(
        "flex-1 overflow-auto transition-opacity duration-300",
        state === "expanded" ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <ExplorerTabs
          currentView={currentView}
          flyCompleted={flyCompleted}
          selectedLocation={selectedLocation}
          setCurrentView={setCurrentView}
          onSavedLocationSelect={handleSavedLocationSelect}
        />
      </div>
    </div>
  );
};

export default ExplorerSidebar;
