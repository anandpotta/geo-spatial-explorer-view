import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { storeImageUrl } from '@/utils/clip-mask/core/image-loading';
import { saveFloorPlan } from '@/utils/floor-plan-utils';
import { getCurrentUser } from '@/services/auth-service';

export interface FileUploadHandlingProps {
  onUploadToDrawing?: (drawingId: string, file: File) => void;
}

export function useFileUploadHandling({ onUploadToDrawing }: FileUploadHandlingProps) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef<Set<string>>(new Set());
  const imageAppliedRef = useRef<Set<string>>(new Set());
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        toast.error('You must be logged in to upload images');
        e.target.value = ''; // Reset file input
        return;
      }
      
      console.log(`File selected: ${file.name} (${file.type}, ${file.size} bytes) for drawing ${selectedDrawingId} by user ${currentUser.id}`);
      
      // Dispatch event to signal drawing operation is starting - prevent map navigation
      window.dispatchEvent(new CustomEvent('drawingStart'));
      
      // Skip if currently processing this drawing ID
      if (processingRef.current.has(selectedDrawingId)) {
        console.log(`Already processing drawing ${selectedDrawingId}, skipping duplicate request`);
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        e.target.value = ''; // Reset file input
        window.dispatchEvent(new CustomEvent('drawingEnd')); // Release navigation lock
        return;
      }
      
      processingRef.current.add(selectedDrawingId);
      
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingId, file);
      }
      
      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      console.log(`Created URL for uploaded file: ${imageUrl}`);
      
      // Store the image URL in localStorage for future use, now with user ID association
      storeImageUrl(selectedDrawingId, imageUrl, file.name);
      
      // Also save as a floor plan for consistent storage
      saveFloorPlan(selectedDrawingId, {
        data: imageUrl,
        isPdf: false,
        fileName: file.name
      });
      
      // Show loading toast
      toast.loading('Applying image to drawing...', { id: `uploading-${selectedDrawingId}` });
      
      // First check if path already has clip mask
      const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
      
      if (!svgPathElement) {
        console.error(`Could not find SVG path element for drawing ${selectedDrawingId}`);
        processingRef.current.delete(selectedDrawingId);
        toast.error('Could not find the drawing on the map', { id: `uploading-${selectedDrawingId}` });
        e.target.value = ''; // Reset file input
        window.dispatchEvent(new CustomEvent('drawingEnd')); // Release navigation lock
        return;
      }
      
      console.log(`Found SVG path element:`, svgPathElement);
      
      // Implement a more focused application approach with fewer retries
      const maxRetries = 5; 
      let currentRetry = 0;
      
      const attemptApplyClipMask = () => {
        try {
          // Use our enhanced finder function
          const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
          
          if (svgPathElement) {
            console.log(`Found SVG path element for drawing ID ${selectedDrawingId}`);
            
            // Apply the image directly using svg-utils function with the actual image URL
            console.log(`Applying image URL: ${imageUrl} to drawing: ${selectedDrawingId}`);
            const result = applyImageClipMask(svgPathElement, imageUrl, selectedDrawingId);
            
            if (result) {
              toast.success(`${file.name} applied to drawing`, { id: `uploading-${selectedDrawingId}` });
              imageAppliedRef.current.add(selectedDrawingId);
              processingRef.current.delete(selectedDrawingId);
              
              // Add data attribute for clip mask with user ID
              svgPathElement.setAttribute('data-has-clip-mask', 'true');
              svgPathElement.setAttribute('data-image-url', imageUrl);
              svgPathElement.setAttribute('data-user-id', currentUser.id);
              
              // Trigger a floor plan updated event to notify components
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                  detail: { drawingId: selectedDrawingId, userId: currentUser.id, freshlyUploaded: true } 
                }));
                
                // Keep a delay before releasing the "drawing in progress" state
                // to prevent immediate navigation after upload completes
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('drawingEnd'));
                }, 1000);
              }, 200);
            } else {
              console.error('Failed to apply image as clip mask');
              
              // Retry if unsuccessful
              if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`Retrying to apply clip mask for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
                setTimeout(attemptApplyClipMask, 250 * currentRetry); // Increasing delay with each retry
              } else {
                processingRef.current.delete(selectedDrawingId);
                toast.error('Could not apply image to drawing', { id: `uploading-${selectedDrawingId}` });
                window.dispatchEvent(new CustomEvent('drawingEnd')); // Release navigation lock
              }
            }
          } else {
            console.error('SVG path element not found for drawing ID:', selectedDrawingId);
            
            // Retry if path not found
            if (currentRetry < maxRetries) {
              currentRetry++;
              console.log(`Retrying to find SVG path for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
              setTimeout(attemptApplyClipMask, 250 * currentRetry); // Increasing delay with each retry
            } else {
              processingRef.current.delete(selectedDrawingId);
              toast.error('Could not find the drawing on the map', { id: `uploading-${selectedDrawingId}` });
              window.dispatchEvent(new CustomEvent('drawingEnd')); // Release navigation lock
            }
          }
        } catch (err) {
          console.error('Error in handleFileChange:', err);
          
          // Retry on error
          if (currentRetry < maxRetries) {
            currentRetry++;
            setTimeout(attemptApplyClipMask, 250 * currentRetry);
          } else {
            processingRef.current.delete(selectedDrawingId);
            toast.error('Error processing the uploaded file', { id: `uploading-${selectedDrawingId}` });
            window.dispatchEvent(new CustomEvent('drawingEnd')); // Release navigation lock
          }
        }
      };
      
      // Start the retry process with an initial delay
      setTimeout(attemptApplyClipMask, 100);
      
      e.target.value = ''; // Reset file input
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    console.log(`Upload requested for drawing ID: ${drawingId}`);
    setSelectedDrawingId(drawingId);
    
    // Open file dialog
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return {
    selectedDrawingId,
    setSelectedDrawingId,
    handleFileChange,
    handleUploadRequest,
    fileInputRef
  };
}
