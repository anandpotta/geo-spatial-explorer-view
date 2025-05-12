
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import DeleteLocationDialog from './DeleteLocationDialog';
import RenameLocationDialog from './RenameLocationDialog';
import LocationListItem from './LocationListItem';
import { toast } from 'sonner';

interface SavedLocationsProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocations = ({ onLocationSelect }: SavedLocationsProps) => {
  const {
    markers,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    markerToDelete,
    isRenameDialogOpen,
    setIsRenameDialogOpen,
    markerToRename,
    handleDelete,
    handleRename,
    confirmDelete,
    confirmRename,
    cancelDelete,
    cancelRename
  } = useSavedLocations();
  
  const handleSelect = (position: [number, number]) => {
    onLocationSelect(position);
    toast.success("Navigating to saved location");
  };
  
  if (markers.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No saved locations yet</p>
      </div>
    );
  }
  
  return (
    <>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 p-2">
          {markers.map(marker => (
            <LocationListItem
              key={marker.id}
              marker={marker}
              onSelect={handleSelect}
              onDelete={(id, e) => handleDelete(id, e)}
              onRename={(id, e) => handleRename(id, e)}
            />
          ))}
        </div>
      </ScrollArea>

      <DeleteLocationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        markerToDelete={markerToDelete}
        onConfirmDelete={confirmDelete}
        onCancel={cancelDelete}
      />

      <RenameLocationDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        markerToRename={markerToRename}
        onConfirmRename={confirmRename}
        onCancel={cancelRename}
      />
    </>
  );
};

export default SavedLocations;
