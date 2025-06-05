
import React from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, MapPinOff, Trash2, Edit2, Save, X } from 'lucide-react';

interface UserMarkerPopupProps {
  markerName: string;
  isEditing: boolean;
  editName: string;
  setEditName: (name: string) => void;
  isPinned: boolean;
  isDeleting: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onRename: (name: string) => void;
  onPinToggle: () => void;
  onDelete: () => void;
}

const UserMarkerPopup = ({
  markerName,
  isEditing,
  editName,
  setEditName,
  isPinned,
  isDeleting,
  onStartEditing,
  onCancelEditing,
  onRename,
  onPinToggle,
  onDelete
}: UserMarkerPopupProps) => {
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editName.trim()) {
      onRename(editName);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancelEditing();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartEditing();
  };

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPinToggle();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  };

  const handlePopupClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setEditName(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editName.trim()) {
      e.preventDefault();
      e.stopPropagation();
      onRename(editName);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onCancelEditing();
    }
  };

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false} 
      maxWidth={300} 
      minWidth={250}
      keepInView={true}
    >
      <div className="p-2" onClick={handlePopupClick}>
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Location name"
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editName.trim()}
                className="flex-1"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">{markerName}</h3>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
              >
                <Edit2 size={12} />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePin}
                className="flex items-center gap-1"
              >
                {isPinned ? (
                  <>
                    <MapPinOff size={12} />
                    Unpin
                  </>
                ) : (
                  <>
                    <MapPin size={12} />
                    Pin
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="w-full flex items-center gap-1"
              disabled={isDeleting}
            >
              <Trash2 size={12} />
              Delete Location
            </Button>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default UserMarkerPopup;
