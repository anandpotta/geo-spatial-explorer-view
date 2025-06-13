
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
      
      console.log(`📁 FileUpload: File selected: ${file.name} (${file.type}, ${file.size} bytes) for drawing ${selectedDrawingId}`);
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large. Please select a file smaller than 10MB.');
        e.target.value = '';
        return;
      }
      
      // Skip if currently processing this drawing ID
      if (processingRef.current.has(selectedDrawingId)) {
        console.log(`⏳ FileUpload: Already processing drawing ${selectedDrawingId}, skipping duplicate request`);
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
        
        console.log('📊 FileUpload: File converted to data URL successfully');
        
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
        
        console.log('💾 FileUpload: Floor plan saved successfully');
        
        // Update loading message
        toast.loading('Applying image to drawing...', { id: `uploading-${selectedDrawingId}` });
        
        // Wait a bit for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the SVG path element with multiple attempts
        let svgPathElement = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!svgPathElement && attempts < maxAttempts) {
          svgPathElement = findSvgPathByDrawingId(selectedDrawingId);
          if (!svgPathElement) {
            console.log(`🔍 FileUpload: Attempt ${attempts + 1}: Could not find SVG path element for drawing ${selectedDrawingId}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }
        }
        
        if (!svgPathElement) {
          console.error(`❌ FileUpload: Could not find SVG path element for drawing ${selectedDrawingId} after ${maxAttempts} attempts`);
          
          // Still trigger the floor plan updated event for the useSvgPathManagement hook to handle
          console.log(`🔄 FileUpload: Triggering floorPlanUpdated event for ${selectedDrawingId} (no path element found)`);
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
            detail: { drawingId: selectedDrawingId, userId: currentUser.id, freshlyUploaded: true }
          }));
          
          processingRef.current.delete(selectedDrawingId);
          toast.success(`${file.name} uploaded successfully! The image will be applied when the drawing is ready.`, { id: `uploading-${selectedDrawingId}` });
          e.target.value = '';
          return;
        }
        
        console.log(`✅ FileUpload: Found SVG path element for drawing ${selectedDrawingId} after ${attempts + 1} attempts`);
        
        // Apply the image directly
        console.log(`🎨 FileUpload: Applying image to drawing ${selectedDrawingId}`);
        const result = applyImageClipMask(svgPathElement, dataUrl, selectedDrawingId);
        
        if (result) {
          console.log(`🎉 FileUpload: Successfully applied clip mask to drawing ${selectedDrawingId}`);
          toast.success(`${file.name} applied successfully!`, { id: `uploading-${selectedDrawingId}` });
          
          // Add data attributes
          svgPathElement.setAttribute('data-has-clip-mask', 'true');
          svgPathElement.setAttribute('data-image-url', dataUrl);
          svgPathElement.setAttribute('data-user-id', currentUser.id);
          
          // Trigger UI updates
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
              detail: { drawingId: selectedDrawingId, userId: currentUser.id, freshlyUploaded: true } 
            }));
          }, 100);
        } else {
          console.error(`❌ FileUpload: Failed to apply clip mask directly, triggering event for retry`);
          
          // Trigger the floor plan updated event for the useSvgPathManagement hook to handle
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', { 
            detail: { drawingId: selectedDrawingId, userId: currentUser.id, freshlyUploaded: true }
          }));
          
          toast.success(`${file.name} uploaded successfully! Applying to drawing...`, { id: `uploading-${selectedDrawingId}` });
        }
        
        processingRef.current.delete(selectedDrawingId);
        
      } catch (error) {
        console.error('❌ FileUpload: Error processing file:', error);
        processingRef.current.delete(selectedDrawingId);
        toast.error('Failed to process the file', { id: `uploading-${selectedDrawingId}` });
      }
      
      e.target.value = '';
    }
  };

  const handleUploadRequest = (drawingId: string) => {
    console.log(`📤 FileUpload: Upload requested for drawing ID: ${drawingId}`);
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
