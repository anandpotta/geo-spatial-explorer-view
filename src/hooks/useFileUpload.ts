import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { createImageFromFile, applyPathMaskToImage } from '@/utils/image-mask-utils';
import { getSavedDrawings, saveDrawing } from '@/utils/drawing/operations';
import { getSVGPathFromLayer } from '@/utils/leaflet-drawing-config';

export function useFileUpload({ onUploadToDrawing }: { 
  onUploadToDrawing?: (drawingId: string, file: File) => void 
}) {
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedDrawingId) {
      const file = e.target.files[0];
      
      // If user provided a callback, use it
      if (onUploadToDrawing) {
        onUploadToDrawing(selectedDrawingId, file);
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Otherwise, handle the upload ourselves
      try {
        setProcessingImage(true);
        toast.info("Processing image...");
        
        // Find the drawing
        const drawings = getSavedDrawings();
        const drawingIndex = drawings.findIndex(d => d.id === selectedDrawingId);
        
        if (drawingIndex === -1) {
          toast.error("Drawing not found");
          return;
        }
        
        const drawing = drawings[drawingIndex];
        
        // Make sure we have a SVG path
        if (!drawing.svgPath) {
          toast.error("Drawing has no path data");
          return;
        }
        
        // Load the image
        const image = await createImageFromFile(file);
        
        // Apply the mask
        const maskedImageSrc = await applyPathMaskToImage(image, drawing.svgPath);
        
        // Update the drawing
        const updatedDrawing = {
          ...drawing,
          maskedImage: {
            src: maskedImageSrc,
            rotation: 0,
            originalFile: file.name
          }
        };
        
        // Save the drawing
        saveDrawing(updatedDrawing);
        
        toast.success("Image added to drawing");
      } catch (err) {
        console.error('Error processing image:', err);
        toast.error("Failed to process image");
      } finally {
        setProcessingImage(false);
        e.target.value = ''; // Reset file input
      }
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    setSelectedDrawingId(drawingId);
  };

  const handleRotateImage = (drawingId: string, degrees: number) => {
    try {
      // Find the drawing
      const drawings = getSavedDrawings();
      const drawingIndex = drawings.findIndex(d => d.id === drawingId);
      
      if (drawingIndex === -1) {
        toast.error("Drawing not found");
        return;
      }
      
      const drawing = drawings[drawingIndex];
      
      // Make sure we have a masked image
      if (!drawing.maskedImage) {
        toast.error("No image to rotate");
        return;
      }
      
      // Update rotation
      const currentRotation = drawing.maskedImage.rotation || 0;
      const newRotation = (currentRotation + degrees) % 360;
      
      // Create updated drawing object
      const updatedDrawing = {
        ...drawing,
        maskedImage: {
          ...drawing.maskedImage,
          rotation: newRotation
        }
      };
      
      // Save the drawing
      saveDrawing(updatedDrawing);
      
      // Re-apply mask with new rotation
      reapplyMaskWithRotation(updatedDrawing);
      
    } catch (err) {
      console.error('Error rotating image:', err);
      toast.error("Failed to rotate image");
    }
  };
  
  // Re-apply mask with new rotation
  const reapplyMaskWithRotation = async (drawing: any) => {
    if (!drawing.maskedImage || !drawing.svgPath) return;
    
    try {
      setProcessingImage(true);
      
      // Create a temporary image from the original source
      const tempImg = new Image();
      tempImg.onload = async () => {
        try {
          // Apply the mask with the new rotation
          const maskedImageSrc = await applyPathMaskToImage(
            tempImg, 
            drawing.svgPath, 
            drawing.maskedImage.rotation
          );
          
          // Update the drawing
          const updatedDrawing = {
            ...drawing,
            maskedImage: {
              ...drawing.maskedImage,
              src: maskedImageSrc
            }
          };
          
          // Save the drawing
          saveDrawing(updatedDrawing);
          toast.success("Image rotated");
        } catch (err) {
          console.error('Error reapplying mask:', err);
          toast.error("Failed to rotate image");
        } finally {
          setProcessingImage(false);
        }
      };
      
      // Load a new image file if one exists, otherwise try to use the existing src
      // This is not ideal as we're losing quality each time, but would need original file storage
      // for a better implementation
      tempImg.onerror = () => {
        toast.error("Could not load image for rotation");
        setProcessingImage(false);
      };
      
      tempImg.src = drawing.maskedImage.src;
      
    } catch (err) {
      console.error('Error in reapplyMaskWithRotation:', err);
      setProcessingImage(false);
    }
  };
  
  return {
    selectedDrawingId,
    setSelectedDrawingId,
    processingImage,
    handleFileChange,
    handleUploadRequest,
    handleRotateImage
  };
}
