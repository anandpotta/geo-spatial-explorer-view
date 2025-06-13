
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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        toast.error('You must be logged in to upload images');
        e.target.value = '';
        return;
      }
      
      console.log(`File selected: ${file.name} (${file.type}, ${file.size} bytes) for drawing ${selectedDrawingId}`);
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Please select a file smaller than 10MB.');
        e.target.value = '';
        return;
      }
      
      // Skip if currently processing this drawing ID
      if (processingRef.current.has(selectedDrawingId)) {
        console.log(`Already processing drawing ${selectedDrawingId}, skipping duplicate request`);
        e.target.value = '';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('Please select an image or PDF file');
        e.target.value = '';
        return;
      }
      
      processingRef.current.add(selectedDrawingId);
      
      // Show loading toast immediately
      toast.loading('Processing file...', { id: `uploading-${selectedDrawingId}` });
      
      try {
        // Convert file to data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              resolve(event.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Error reading file'));
          reader.readAsDataURL(file);
        });
        
        console.log('File converted to data URL successfully');
        
        // Call the upload callback if provided
        if (onUploadToDrawing) {
          onUploadToDrawing(selectedDrawingId, file);
        }
        
        // Store the image URL for future use
        storeImageUrl(selectedDrawingId, dataUrl, file.name);
        
        // Save as a floor plan
        const saveSuccess = await saveFloorPlan(selectedDrawingId, {
          data: dataUrl,
          isPdf: file.type === 'application/pdf',
          fileName: file.name
        });
        
        if (!saveSuccess) {
          processingRef.current.delete(selectedDrawingId);
          toast.error('Failed to save floor plan', { id: `uploading-${selectedDrawingId}` });
          e.target.value = '';
          return;
        }
        
        // Update loading message
        toast.loading('Applying image to drawing...', { id: `uploading-${selectedDrawingId}` });
        
        // Wait a bit for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find the SVG path element with multiple attempts
        let svgPathElement = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!svgPathElement && attempts < maxAttempts) {
          svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
          if (!svgPathElement) {
            console.log(`Attempt ${attempts + 1}: Could not find SVG path element for drawing ${selectedDrawingId}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }
        
        if (!svgPathElement) {
          console.error(`Could not find SVG path element for drawing ${selectedDrawingId} after ${maxAttempts} attempts`);
          processingRef.current.delete(selectedDrawingId);
          toast.error('Could not find the drawing on the map', { id: `uploading-${selectedDrawingId}` });
          e.target.value = '';
          return;
        }
        
        console.log(`Found SVG path element for drawing ${selectedDrawingId} after ${attempts + 1} attempts`);
        
        // Apply the image with retries
        let retryCount = 0;
        const maxRetries = 5;
        
        const attemptApplyClipMask = async () => {
          try {
            // Re-find the path element to ensure it's still valid
            const pathElement = findSvgPathByDrawingId(selectedDrawingId);
            
            if (!pathElement) {
              throw new Error('Path element not found during application');
            }
            
            console.log(`Applying image to drawing ${selectedDrawingId} (attempt ${retryCount + 1})`);
            
            // Apply the clip mask
            const result = applyImageClipMask(pathElement, dataUrl, selectedDrawingId);
            
            if (result) {
              console.log(`Successfully applied clip mask to drawing ${selectedDrawingId}`);
              toast.success(`${file.name} applied successfully!`, { id: `uploading-${selectedDrawingId}` });
              processingRef.current.delete(selectedDrawingId);
              
              // Add data attributes
              pathElement.setAttribute('data-has-clip-mask', 'true');
              pathElement.setAttribute('data-image-url', dataUrl);
              pathElement.setAttribute('data-user-id', currentUser.id);
              
              // Trigger UI updates
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                  detail: { drawingId: selectedDrawingId, userId: currentUser.id, freshlyUploaded: true } 
                }));
              }, 100);
              
              return true;
            } else {
              throw new Error('applyImageClipMask returned false');
            }
          } catch (err) {
            console.error(`Attempt ${retryCount + 1} failed:`, err);
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying in ${500 * retryCount}ms...`);
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
              return attemptApplyClipMask();
            } else {
              processingRef.current.delete(selectedDrawingId);
              toast.error('Could not apply image to drawing after multiple attempts', { id: `uploading-${selectedDrawingId}` });
              console.error('All retry attempts failed');
              return false;
            }
          }
        };
        
        // Start the application process
        await attemptApplyClipMask();
        
      } catch (error) {
        console.error('Error processing file:', error);
        processingRef.current.delete(selectedDrawingId);
        toast.error('Failed to process the file', { id: `uploading-${selectedDrawingId}` });
      }
      
      e.target.value = '';
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
