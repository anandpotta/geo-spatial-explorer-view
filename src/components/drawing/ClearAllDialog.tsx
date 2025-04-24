
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

interface ClearAllDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClearAll: () => void;
}

const ClearAllDialog = ({ isOpen, onOpenChange, onClearAll }: ClearAllDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clear all drawings and markers? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClearAll}>Clear All</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearAllDialog;
