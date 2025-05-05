
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { applyImageClipMask, findSvgPathByDrawingId, hasClipMaskApplied } from '@/utils/svg-clip-mask';
import { debugSvgElement } from '@/utils/svg-debug-utils';

export function useFileUpload({ onUploadToDrawing }: { 
  onUploadToDrawing?: (drawingId: string, file: File) => void 
}) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [imageOverlay, setImageOverlay] = useState<L.ImageOverlay | null>(null);
  const imageAppliedRef = useRef<Set<string>>(new Set());
  const processingRef = useRef<Set<string>>(new Set());
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      
      console.log(`File selected: ${file.name} (${file.type}, ${file.size} bytes) for drawing ${selectedDrawingId}`);
      
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
        return;
      }
      
      processingRef.current.add(selectedDrawingId);
      
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingId, file);
      }
      
      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      console.log(`Created URL for uploaded file: ${imageUrl}`);
      
      // Store the image URL in localStorage for future use
      try {
        const floorPlanKey = `floorplan-${selectedDrawingId}`;
        const floorPlanData = { 
          imageUrl, 
          timestamp: Date.now(),
          fileName: file.name
        };
        localStorage.setItem(floorPlanKey, JSON.stringify(floorPlanData));
        console.log(`Stored image URL in localStorage with key: ${floorPlanKey}`);
      } catch (err) {
        console.error('Error storing image URL in localStorage:', err);
      }
      
      // Show loading toast
      toast.loading('Applying image to drawing...', { id: `uploading-${selectedDrawingId}` });
      
      // First check if path already has clip mask
      const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
      
      if (!svgPathElement) {
        console.error(`Could not find SVG path element for drawing ${selectedDrawingId}`);
        processingRef.current.delete(selectedDrawingId);
        toast.error('Could not find the drawing on the map', { id: `uploading-${selectedDrawingId}` });
        e.target.value = ''; // Reset file input
        return;
      }
      
      console.log(`Found SVG path element:`, svgPathElement);
      
      // Even if it already has a clip mask, we'll reapply it with the new image
      // This handles both updating existing masks and applying new ones
      
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
              
              // Force the browser to recognize changes
              setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
                  detail: { drawingId: selectedDrawingId } 
                }));
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
  };
  
  return {
    selectedDrawingId,
    setSelectedDrawingId,
    handleFileChange,
    handleUploadRequest,
    imageOverlay
  };
}
