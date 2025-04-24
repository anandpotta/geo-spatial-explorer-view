
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
import { LocationMarker } from '@/utils/geo-utils';

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
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{markerToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLocationDialog;
