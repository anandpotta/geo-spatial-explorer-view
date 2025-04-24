
import { LocationMarker } from '@/utils/geo-utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRef } from 'react';

interface DeleteLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  markerToDelete: LocationMarker | null;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

const DeleteLocationDialog = ({
  isOpen,
  onOpenChange,
  markerToDelete,
  onConfirmDelete,
  onCancel,
}: DeleteLocationDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirmDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLocationDialog;
