
import React, { useState } from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, X } from 'lucide-react';
import { LocationMarker } from '@/utils/marker-utils';

interface MarkerEditPopupProps {
  marker: LocationMarker;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const MarkerEditPopup = ({ marker, onRename, onDelete, onClose }: MarkerEditPopupProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(marker.name);

  const handleRename = () => {
    if (editName.trim() && editName !== marker.name) {
      onRename(marker.id, editName.trim());
    }
    setIsEditing(false);
    onClose();
  };

  const handleDelete = () => {
    onDelete(marker.id);
    onClose();
  };

  return (
    <Popup>
      <div className="p-2 min-w-[200px]">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Location Options</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Location name"
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleRename}
                disabled={!editName.trim()}
                className="flex-1"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(marker.name);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{marker.name}</p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Rename
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MarkerEditPopup;
