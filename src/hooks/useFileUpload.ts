
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { applyImageClipMask } from '@/utils/svg-utils';

export function useFileUpload({ onUploadToDrawing }: { 
  onUploadToDrawing?: (drawingId: string, file: File) => void 
}) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [imageOverlay, setImageOverlay] = useState<L.ImageOverlay | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingId, file);
      }
      
      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      console.log(`Created URL for uploaded file: ${imageUrl}`);
      
      // Implement a retry mechanism for finding and applying clip mask
      const maxRetries = 5;
      let currentRetry = 0;
      
      const attemptApplyClipMask = () => {
        try {
          // Find the SVG path element that corresponds to the drawing
          const svgPathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${selectedDrawingId}"]`);
          
          if (svgPathElement) {
            console.log(`Found SVG path element for drawing ID ${selectedDrawingId}:`, svgPathElement);
            
            // Apply the image directly using svg-utils function
            const result = applyImageClipMask(svgPathElement as SVGPathElement, imageUrl, selectedDrawingId);
            
            if (result) {
              toast.success(`${file.name} applied to drawing`);
            } else {
              console.error('Failed to apply image as clip mask');
              
              // Retry if unsuccessful
              if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`Retrying to apply clip mask for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
                setTimeout(attemptApplyClipMask, 500);
              } else {
                toast.error('Could not apply image to drawing');
              }
            }
          } else {
            console.error('SVG path element not found for drawing ID:', selectedDrawingId);
            
            // Retry if path not found
            if (currentRetry < maxRetries) {
              currentRetry++;
              console.log(`Retrying to find SVG path for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
              setTimeout(attemptApplyClipMask, 500);
            } else {
              toast.error('Could not find the drawing on the map');
            }
          }
        } catch (err) {
          console.error('Error in handleFileChange:', err);
          
          // Retry on error
          if (currentRetry < maxRetries) {
            currentRetry++;
            setTimeout(attemptApplyClipMask, 500);
          } else {
            toast.error('Error processing the uploaded file');
          }
        }
      };
      
      // Start the retry process with an initial delay
      setTimeout(attemptApplyClipMask, 500);
      
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
