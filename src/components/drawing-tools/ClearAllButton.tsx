
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteMarker, getSavedMarkers } from '@/utils/marker-utils';
import { deleteDrawing, getSavedDrawings } from '@/utils/drawing-utils';
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

interface ClearAllButtonProps {
  onClearAll?: () => void;
}

const ClearAllButton = ({ onClearAll }: ClearAllButtonProps) => {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  const handleClearAll = () => {
    const markers = getSavedMarkers();
    const drawings = getSavedDrawings();

    markers.forEach(marker => {
      deleteMarker(marker.id);
    });

    drawings.forEach(drawing => {
      deleteDrawing(drawing.id);
    });

    localStorage.removeItem('savedMarkers');
    localStorage.removeItem('savedDrawings');
    localStorage.removeItem('floorPlans');

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('markersUpdated'));
    window.dispatchEvent(new Event('floorPlanUpdated'));
    
    if (onClearAll) {
      onClearAll();
    }
    
    setIsClearDialogOpen(false);
    toast.success('All layers cleared');
  };
  
  return (
    <>
      <button
        className="w-full p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
        onClick={() => setIsClearDialogOpen(true)}
        aria-label="Clear all layers"
      >
        <Trash2 className="h-5 w-5" />
        <span className="ml-2">Clear All</span>
      </button>
      
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Layers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all drawings and markers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClearAllButton;
