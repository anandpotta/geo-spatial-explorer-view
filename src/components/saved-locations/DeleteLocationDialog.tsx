
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
import { useRef, useEffect } from 'react';

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
  
  // Handle dialog closing and focus management
  useEffect(() => {
    if (!isOpen) {
      // Return focus to the body element if dialog closes
      setTimeout(() => {
        document.body.focus();
      }, 0);
    }

    // Add escape key handling
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onCancel]);
  
  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            ref={cancelRef} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
