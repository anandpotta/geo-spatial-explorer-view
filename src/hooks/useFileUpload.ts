
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
      
      // Skip if currently processing this drawing ID
      if (processingRef.current.has(selectedDrawingId)) {
        console.log(`Already processing drawing ${selectedDrawingId}, skipping duplicate request`);
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
      
      // First check if path already has clip mask
      const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
      if (svgPathElement && hasClipMaskApplied(svgPathElement)) {
        console.log(`Drawing ${selectedDrawingId} already has clip mask, refreshing view`);
        // Just update the last-updated timestamp to trigger a repaint
        requestAnimationFrame(() => {
          if (svgPathElement) {
            svgPathElement.setAttribute('data-last-updated', Date.now().toString());
            
            // Only show toast if we found the element
            toast.success(`${file.name} applied to drawing`);
            imageAppliedRef.current.add(selectedDrawingId);
          }
        });
        processingRef.current.delete(selectedDrawingId);
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Implement a more focused application approach with fewer retries
      const maxRetries = 5; 
      let currentRetry = 0;
      
      const attemptApplyClipMask = () => {
        try {
          // Use our enhanced finder function
          const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
          
          if (svgPathElement) {
            console.log(`Found SVG path element for drawing ID ${selectedDrawingId}`);
            
            // Double check if element already has clip mask
            if (hasClipMaskApplied(svgPathElement)) {
              console.log(`Drawing ${selectedDrawingId} already has clip mask, skipping application`);
              processingRef.current.delete(selectedDrawingId);
              toast.success(`${file.name} applied to drawing`);
              return;
            }
            
            // Apply the image directly using svg-utils function
            const result = applyImageClipMask(svgPathElement, imageUrl, selectedDrawingId);
            
            if (result) {
              toast.success(`${file.name} applied to drawing`);
              imageAppliedRef.current.add(selectedDrawingId);
              processingRef.current.delete(selectedDrawingId);
            } else {
              console.error('Failed to apply image as clip mask');
              
              // Retry if unsuccessful
              if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`Retrying to apply clip mask for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
                setTimeout(attemptApplyClipMask, 250 * currentRetry); // Increasing delay with each retry
              } else {
                processingRef.current.delete(selectedDrawingId);
                toast.error('Could not apply image to drawing');
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
              toast.error('Could not find the drawing on the map');
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
            toast.error('Error processing the uploaded file');
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
