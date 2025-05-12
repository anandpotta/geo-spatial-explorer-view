
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LocationMarker } from '@/utils/geo-utils';

interface RenameLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  markerToRename: LocationMarker | null;
  onConfirmRename: (id: string, newName: string) => void;
  onCancel: () => void;
}

const RenameLocationDialog = ({
  isOpen,
  onOpenChange,
  markerToRename,
  onConfirmRename,
  onCancel,
}: RenameLocationDialogProps) => {
  const [newName, setNewName] = useState('');
  
  // Set the initial name when the marker changes
  React.useEffect(() => {
    if (markerToRename) {
      setNewName(markerToRename.name);
    }
  }, [markerToRename]);

  const handleRename = () => {
    if (markerToRename && newName.trim()) {
      onConfirmRename(markerToRename.id, newName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Location</DialogTitle>
          <DialogDescription>
            Enter a new name for this location.
          </DialogDescription>
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
          <DialogClose asChild>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleRename} disabled={!newName.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameLocationDialog;
