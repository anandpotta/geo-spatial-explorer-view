
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { applyImageClipMask, findSvgPathByDrawingId } from '@/utils/svg-clip-mask';
import { debugSvgElement } from '@/utils/svg-debug-utils';

export function useFileUpload({ onUploadToDrawing }: { 
  onUploadToDrawing?: (drawingId: string, file: File) => void 
}) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [imageOverlay, setImageOverlay] = useState<L.ImageOverlay | null>(null);
  const imageAppliedRef = useRef<Set<string>>(new Set());
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingId, file);
      }
      
      // Skip if we've already applied an image to this drawing in this session
      // to avoid duplicate processing which can cause flickering
      if (imageAppliedRef.current.has(selectedDrawingId)) {
        console.log(`Image already applied to drawing ${selectedDrawingId}, refreshing view`);
        // Force redraw without triggering a resize event
        setTimeout(() => {
          const pathElement = findSvgPathByDrawingId(selectedDrawingId);
          if (pathElement) {
            // Just touch an attribute to force a repaint without causing flickering
            pathElement.setAttribute('data-last-updated', Date.now().toString());
          }
        }, 100);
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Create a URL for the image
      const imageUrl = URL.createObjectURL(file);
      console.log(`Created URL for uploaded file: ${imageUrl}`);
      
      // Implement a more robust retry mechanism for finding and applying clip mask
      const maxRetries = 8; // Reduced number of retries to avoid too many DOM operations
      let currentRetry = 0;
      
      const attemptApplyClipMask = () => {
        try {
          // Use our enhanced finder function
          const svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
          
          if (svgPathElement) {
            console.log(`Found SVG path element for drawing ID ${selectedDrawingId}`);
            
            // Apply the image directly using svg-utils function
            const result = applyImageClipMask(svgPathElement, imageUrl, selectedDrawingId);
            
            if (result) {
              toast.success(`${file.name} applied to drawing`);
              imageAppliedRef.current.add(selectedDrawingId);
              
              // Don't force window resize as it can cause flickering
              // Just repaint the specific element instead
              requestAnimationFrame(() => {
                if (svgPathElement.parentElement) {
                  // Force repaint by touching the SVG
                  svgPathElement.parentElement.style.transform = 'translateZ(0)';
                  setTimeout(() => {
                    svgPathElement.parentElement.style.removeProperty('transform');
                  }, 10);
                }
              });
            } else {
              console.error('Failed to apply image as clip mask');
              
              // Retry if unsuccessful
              if (currentRetry < maxRetries) {
                currentRetry++;
                console.log(`Retrying to apply clip mask for ${selectedDrawingId} (Attempt ${currentRetry} of ${maxRetries})`);
                setTimeout(attemptApplyClipMask, 250 * currentRetry); // Increasing delay with each retry
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
              setTimeout(attemptApplyClipMask, 250 * currentRetry); // Increasing delay with each retry
            } else {
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
            toast.error('Error processing the uploaded file');
          }
        }
      };
      
      // Start the retry process with an initial delay
      setTimeout(attemptApplyClipMask, 150);
      
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
