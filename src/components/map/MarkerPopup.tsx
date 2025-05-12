
import { useState } from 'react';
import { Popup } from 'react-leaflet';
import { LocationMarker } from '@/utils/markers/types';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface MarkerPopupProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
}

const MarkerPopup = ({ marker, onDelete }: MarkerPopupProps) => {
  const [isPinned, setIsPinned] = useState(marker.isPinned || false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState(marker.name);

  const handlePinToggle = () => {
    const updatedPinnedState = !isPinned;
    setIsPinned(updatedPinnedState);
    
    // Update the marker in localStorage
    const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
    const updatedMarkers = markers.map((m: LocationMarker) => 
      m.id === marker.id ? { ...m, isPinned: updatedPinnedState } : m
    );
    localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'));
  };

  const handleRename = () => {
    setIsRenameDialogOpen(true);
  };

  const handleSaveRename = () => {
    if (newName.trim()) {
      // Update the marker in localStorage
      const markers = JSON.parse(localStorage.getItem('savedMarkers') || '[]');
      const updatedMarkers = markers.map((m: LocationMarker) => 
        m.id === marker.id ? { ...m, name: newName.trim() } : m
      );
      localStorage.setItem('savedMarkers', JSON.stringify(updatedMarkers));
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('markersUpdated'));
      
      setIsRenameDialogOpen(false);
    }
  };

  return (
    <>
      <Popup>
        <div className="p-2">
          <h3 className="font-medium mb-2">{marker.name}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePinToggle}
              className="flex items-center gap-1"
            >
              {isPinned ? (
                <>
                  <MapPinOff size={16} />
                  Unpin
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  Pin
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRename}
              className="flex items-center gap-1"
            >
              <Edit size={16} />
              Rename
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(marker.id)}
              className="flex items-center gap-1"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>
      </Popup>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Location</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Location name"
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename} disabled={!newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarkerPopup;
