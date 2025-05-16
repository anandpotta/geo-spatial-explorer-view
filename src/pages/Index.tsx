
import { useEffect } from 'react';
import MapContent from '@/components/explorer/MapContent';
import ExplorerSidebar from '@/components/explorer/ExplorerSidebar';
import { useLocationNavigation } from '@/hooks/explorer/useLocationNavigation';
import { useViewTransition } from '@/hooks/explorer/useViewTransition';
import { toast } from 'sonner';

const Index = () => {
  const {
    selectedLocation,
    flyCompleted,
    shouldSwitchToLeaflet,
    setShouldSwitchToLeaflet,
    handleLocationSelect,
    handleFlyComplete,
    handleSavedLocationSelect,
    clearSelectedLocation,
    isTransitionInProgress,
    cleanup
  } = useLocationNavigation();

  const {
    currentView,
    viewTransitionReady,
    handleViewChange,
    handleMapReady,
    isViewTransitionInProgress
  } = useViewTransition(
    flyCompleted,
    shouldSwitchToLeaflet,
    setShouldSwitchToLeaflet,
    selectedLocation,
    isTransitionInProgress
  );
  
  // Handle clearing the selected location
  const handleClearLocation = () => {
    clearSelectedLocation();
    toast.info("Location cleared");
  };
  
  // Cleanup effect
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="h-screen flex">
      <ExplorerSidebar 
        selectedLocation={selectedLocation}
        currentView={currentView}
        flyCompleted={flyCompleted}
        setCurrentView={handleViewChange}
        onSavedLocationSelect={handleSavedLocationSelect}
      />
      <MapContent 
        currentView={currentView}
        selectedLocation={selectedLocation}
        onMapReady={handleMapReady}
        onFlyComplete={handleFlyComplete}
        onLocationSelect={handleLocationSelect}
        onClearLocation={handleClearLocation}
        viewTransitionReady={viewTransitionReady}
        viewTransitionInProgress={isViewTransitionInProgress}
      />
    </div>
  );
};

export default Index;
