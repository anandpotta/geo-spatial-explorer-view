
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import L from 'leaflet';
import { getMapFromLayer, isMapValid } from '@/utils/leaflet-type-utils';

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
          // Apply the image as a clip mask
          applyClipMask(svgPathElement as SVGElement, imageUrl, selectedDrawingId);
        } else {
          console.error('SVG path element not found for drawing ID:', selectedDrawingId);
        }
      }
      
      e.target.value = ''; // Reset file input
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    setSelectedDrawingId(drawingId);
  };
  
  // Function to apply image clip mask to an SVG path
  const applyClipMask = (pathElement: SVGElement, imageUrl: string, drawingId: string) => {
    try {
      // Get the bounding box of the path
      const bbox = pathElement.getBBox();
      const svg = pathElement.ownerSVGElement;
      
      if (!svg) {
        console.error('SVG element not found');
        return;
      }
      
      // Create unique IDs for this mask
      const clipPathId = `clip-path-${drawingId}`;
      const patternId = `pattern-${drawingId}`;
      
      // Check if elements already exist and remove them
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
      }
      
      // Remove existing elements with the same IDs
      const existingClipPath = svg.getElementById(clipPathId);
      if (existingClipPath) {
        existingClipPath.remove();
      }
      
      const existingPattern = svg.getElementById(patternId);
      if (existingPattern) {
        existingPattern.remove();
      }
      
      // Create clip path using the original path
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipPathId);
      
      // Clone the original path for the clip path
      const pathClone = pathElement.cloneNode(true) as SVGPathElement;
      pathClone.removeAttribute('style');
      pathClone.setAttribute('fill', '#ffffff');
      clipPath.appendChild(pathClone);
      
      // Create pattern for the image
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      pattern.setAttribute('id', patternId);
      pattern.setAttribute('patternUnits', 'userSpaceOnUse');
      pattern.setAttribute('width', bbox.width.toString());
      pattern.setAttribute('height', bbox.height.toString());
      pattern.setAttribute('x', bbox.x.toString());
      pattern.setAttribute('y', bbox.y.toString());
      
      // Create image element
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttribute('href', imageUrl);
      image.setAttribute('width', bbox.width.toString());
      image.setAttribute('height', bbox.height.toString());
      image.setAttribute('x', '0');
      image.setAttribute('y', '0');
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      
      // Append everything
      pattern.appendChild(image);
      defs.appendChild(clipPath);
      defs.appendChild(pattern);
      
      // Apply clip path and pattern to the original path
      pathElement.setAttribute('clip-path', `url(#${clipPathId})`);
      pathElement.setAttribute('fill', `url(#${patternId})`);
      
      // Save data for future reference
      pathElement.setAttribute('data-has-clip-mask', 'true');
      pathElement.setAttribute('data-image-url', imageUrl);
      
      toast.success('Image applied as clip mask');
    } catch (err) {
      console.error('Error applying clip mask:', err);
      toast.error('Failed to apply image as clip mask');
    }
  };
  
  return {
    selectedDrawingId,
    setSelectedDrawingId,
    handleFileChange,
    handleUploadRequest,
    imageOverlay
  };
}
