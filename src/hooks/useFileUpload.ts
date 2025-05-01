
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';
import { applyImageClipMask } from '@/utils/svg-clip-mask';

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
      
      // Delay to ensure DOM is updated
      setTimeout(() => {
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
              toast.error('Could not apply image to drawing');
            }
          } else {
            console.error('SVG path element not found for drawing ID:', selectedDrawingId);
            toast.error('Could not find the drawing on the map');
          }
        } catch (err) {
          console.error('Error in handleFileChange:', err);
          toast.error('Error processing the uploaded file');
        }
      }, 300); // Increased timeout to ensure path is available
      
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
