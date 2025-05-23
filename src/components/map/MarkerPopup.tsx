
import { useState } from 'react';
import { Popup } from 'react-leaflet';
import { LocationMarker } from '@/utils/markers/types';
import { Button } from '@/components/ui/button';
import { MapPin, MapPinOff, Trash2, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MarkerPopupProps {
  marker: LocationMarker;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

const MarkerPopup = ({ marker, onDelete, onRename }: MarkerPopupProps) => {
  const [isPinned, setIsPinned] = useState(marker.isPinned || false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(marker.name);

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
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering any map click events
    e.stopPropagation();
    e.preventDefault();
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    // Delay the actual delete operation slightly to ensure the event doesn't propagate
    setTimeout(() => {
      onDelete(marker.id);
    }, 10);
  };

  const handleRenameClick = () => {
    setIsEditing(true);
  };

  const handleRenameSave = () => {
    if (onRename && editName.trim() !== '' && editName !== marker.name) {
      onRename(marker.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleRenameCancel = () => {
    setEditName(marker.name);
    setIsEditing(false);
  };

  return (
    <Popup>
      <div className="p-2">
        {isEditing ? (
          <div className="space-y-2">
            <Input 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mb-2"
              autoFocus
              placeholder="Location name"
            />
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleRenameSave}
                className="flex-1"
                disabled={!editName.trim() || editName === marker.name}
              >
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRenameCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-medium mb-2">{marker.name}</h3>
            <div className="flex flex-wrap gap-2">
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
                onClick={handleRenameClick}
                className="flex items-center gap-1"
              >
                <Edit2 size={16} />
                Rename
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="flex items-center gap-1"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </Popup>
  );
};

export default MarkerPopup;
