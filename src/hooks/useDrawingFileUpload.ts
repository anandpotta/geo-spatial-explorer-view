
import { toast } from 'sonner';
import { saveFloorPlan } from '@/utils/floor-plan-utils';
import { getCurrentUser } from '@/services/auth-service';
import { findSvgPathByDrawingId } from '@/utils/svg-path-finder';
import { applyImageClipMask } from '@/utils/svg-clip-mask';
import { debugSvgElement } from '@/utils/svg-debug-utils';

export function useDrawingFileUpload() {
  const handleUploadToDrawing = (drawingId: string, file: File) => {
    console.log(`Processing upload for drawing ${drawingId}, file: ${file.name}`);
    
    // Set preventMapClick flag to avoid unwanted marker creation
    if (window.preventMapClick !== undefined) {
      window.preventMapClick = true;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('Please log in to upload files');
      if (window.preventMapClick !== undefined) {
        window.preventMapClick = false; // Reset flag
      }
      return;
    }
    
    // Handle file upload logic here
    const fileType = file.type;
    
    // Check file type and size
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast.error('Please upload an image or PDF file');
      if (window.preventMapClick !== undefined) {
        window.preventMapClick = false; // Reset flag
      }
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size should be less than 10MB');
      if (window.preventMapClick !== undefined) {
        window.preventMapClick = false; // Reset flag
      }
      return;
    }
    
    // Convert the file to base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result) {
        console.log(`File read complete for ${file.name}`);
        
        // Save the file data to localStorage with user association
        const success = saveFloorPlan(drawingId, {
          data: e.target.result as string,
          isPdf: fileType === 'application/pdf',
          fileName: file.name
        });
        
        if (success) {
          console.log(`Saved floor plan to localStorage for drawing ${drawingId}`);
          
          // Apply the image as a clip mask to the SVG path with multiple attempts
          let attempts = 0;
          const maxAttempts = 10;
          
          const tryApplyMask = () => {
            try {
              const pathElement = findSvgPathByDrawingId(drawingId);
              if (pathElement) {
                console.log(`Found path element for drawing ${drawingId}, applying clip mask (attempt ${attempts + 1})`);
                debugSvgElement(pathElement, `Before applying clip mask to ${drawingId}`);
                
                const result = applyImageClipMask(
                  pathElement, 
                  e.target.result as string, 
                  drawingId
                );
                
                if (result) {
                  console.log(`Successfully applied clip mask for ${file.name}`);
                  debugSvgElement(pathElement, `After applying clip mask to ${drawingId}`);
                  toast.success(`${file.name} applied to drawing`);
                  
                  // Force redraw
                  setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    if (window.preventMapClick !== undefined) {
                      window.preventMapClick = false; // Reset flag after success
                    }
                  }, 300);
                } else if (attempts < maxAttempts) {
                  attempts++;
                  console.log(`Failed to apply mask, retrying (${attempts}/${maxAttempts})...`);
                  setTimeout(tryApplyMask, 300 * attempts);
                } else {
                  console.error('Could not apply image to drawing after multiple attempts');
                  toast.error('Could not apply image to drawing');
                  if (window.preventMapClick !== undefined) {
                    window.preventMapClick = false; // Reset flag
                  }
                }
              } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`Path element not found, retrying (${attempts}/${maxAttempts})...`);
                setTimeout(tryApplyMask, 300 * attempts);
              } else {
                console.error('Path element not found for ID after multiple attempts:', drawingId);
                toast.error('Could not find the drawing on the map');
                if (window.preventMapClick !== undefined) {
                  window.preventMapClick = false; // Reset flag
                }
              }
            } catch (err) {
              console.error('Error applying image to path:', err);
              if (attempts < maxAttempts) {
                attempts++;
                setTimeout(tryApplyMask, 300 * attempts);
              } else {
                toast.error('Failed to apply image to drawing');
                if (window.preventMapClick !== undefined) {
                  window.preventMapClick = false; // Reset flag
                }
              }
            }
          };
          
          // Start the retry process
          setTimeout(tryApplyMask, 100);
        } else {
          if (window.preventMapClick !== undefined) {
            window.preventMapClick = false; // Reset flag on failure
          }
        }
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      toast.error('Failed to read the file');
      if (window.preventMapClick !== undefined) {
        window.preventMapClick = false; // Reset flag on error
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  return { handleUploadToDrawing };
}
