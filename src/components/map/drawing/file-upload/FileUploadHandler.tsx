
import { getCurrentUser } from '@/services/auth-service';
import { toast } from 'sonner';
import { storeFloorPlan } from '@/utils/floor-plan-utils';
import { useRef } from 'react';

interface FileUploadHandlerProps {
  onFloorPlanUpdated: (drawingId: string) => void;
}

export function useFileUploadHandler({ onFloorPlanUpdated }: FileUploadHandlerProps) {
  const attemptQueueRef = useRef<Map<string, number>>(new Map());

  const handleUploadToDrawing = (drawingId: string, file: File) => {
    console.log(`Processing upload for drawing ${drawingId}, file: ${file.name}`);
    
    // Check if user is logged in
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('You must be logged in to upload files');
      return;
    }
    
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Show loading toast
    const loadingId = toast.loading('Processing image...');
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        console.log(`File read complete for ${file.name}`);
        
        try {
          // Save the file data to localStorage using our helper
          storeFloorPlan(drawingId, e.target.result as string);
          console.log(`Saved floor plan to localStorage for drawing ${drawingId}`);
          
          // Dismiss loading toast
          toast.dismiss(loadingId);
          toast.success(`Floor plan "${file.name}" saved`);
          
          // Initialize retry counter
          attemptQueueRef.current.set(drawingId, 0);
          
          // Trigger a custom event to notify components that a floor plan was uploaded
          onFloorPlanUpdated(drawingId);
          
          // Reset the retry counter after 3 seconds
          setTimeout(() => {
            attemptQueueRef.current.delete(drawingId);
          }, 3000);
        } catch (err) {
          console.error('Error storing floor plan:', err);
          toast.dismiss(loadingId);
          toast.error('Error saving floor plan: Storage quota may be full');
        }
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      toast.dismiss(loadingId);
      toast.error('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };

  return {
    handleUploadToDrawing,
    attemptQueueRef
  };
}
