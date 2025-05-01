
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
        
        // Create a URL for the image
        const imageUrl = URL.createObjectURL(file);
        
        // Find the SVG path element that corresponds to the drawing
        const svgPathElement = document.querySelector(`.leaflet-interactive[data-drawing-id="${selectedDrawingId}"]`);
        
        if (svgPathElement) {
          // Apply the image directly using svg-utils function
          applyImageClipMask(svgPathElement as SVGPathElement, imageUrl, selectedDrawingId);
          toast.success(`${file.name} applied to drawing`);
        } else {
          console.error('SVG path element not found for drawing ID:', selectedDrawingId);
          toast.error('Could not find the drawing on the map');
        }
      }
      
      e.target.value = ''; // Reset file input
    }
  };

  const handleUploadRequest = (drawingId: string) => {
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
