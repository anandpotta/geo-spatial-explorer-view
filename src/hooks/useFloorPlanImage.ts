
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { storeFloorPlan, getFloorPlan } from "@/utils/floor-plan-utils";

export function useFloorPlanImage(drawing?: DrawingData | null) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlan = getFloorPlan(drawing.id);
      if (savedFloorPlan) {
        setSelectedImage(savedFloorPlan.imageData);
        // Detect if it's a PDF by checking data URL
        setIsPdf(savedFloorPlan.imageData.startsWith('data:application/pdf'));
        // We don't have filename in getFloorPlan, so we can't set it here
        setFileName('Floor Plan');
      } else {
        // Reset state if no floor plan is found
        setSelectedImage(null);
        setIsPdf(false);
        setFileName('');
      }
    }
  }, [drawing]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }
    
    // Save file name and check if it's a PDF
    setFileName(file.name);
    setIsPdf(file.type.includes('pdf'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && drawing?.id) {
        const dataUrl = result as string;
        setSelectedImage(dataUrl);
        
        try {
          // Save to utils for this specific building
          storeFloorPlan(
            drawing.id,
            dataUrl
          );
          
          toast.success('Floor plan uploaded successfully');
          
          // Dispatch an event to notify that the floor plan was updated
          window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
            detail: {
              drawingId: drawing.id
            }
          }));
        } catch (e) {
          console.error('Error storing floor plan:', e);
          toast.error('Error saving floor plan: Storage quota may be full');
        }
      }
    };
    
    reader.onerror = () => {
      toast.error('Error reading file');
    };
    
    reader.readAsDataURL(file);
    
    // Reset the input value so the same file can be selected again if needed
    if (event.target.value) {
      event.target.value = '';
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return {
    selectedImage,
    isPdf,
    fileName,
    fileInputRef,
    handleFileUpload,
    openFileDialog
  };
}
