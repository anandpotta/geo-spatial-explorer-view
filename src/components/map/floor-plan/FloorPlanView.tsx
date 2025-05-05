
import React from "react";
import { DrawingData } from "@/utils/geo-utils";
import { useFloorPlanImage } from "@/hooks/useFloorPlanImage";
import FloorPlanHeader from "./FloorPlanHeader";
import FloorPlanContent from "./FloorPlanContent";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const {
    selectedImage,
    isPdf,
    fileName,
    fileInputRef,
    handleFileUpload,
    openFileDialog
  } = useFloorPlanImage(drawing);
  
  const handleBackClick = () => {
    // When going back to map, trigger reapplication of all floor plans
    if (drawing?.id) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
          detail: { drawingId: drawing.id }
        }));
      }, 300);
    }
    
    onBack();
  };

  return (
    <div className="relative w-full h-full">
      <FloorPlanHeader 
        onBack={handleBackClick}
        onUploadClick={openFileDialog}
        hasSelectedImage={!!selectedImage}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleFileUpload}
      />
      
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        <FloorPlanContent
          selectedImage={selectedImage}
          isPdf={isPdf}
          fileName={fileName}
          drawingName={drawing?.properties?.name}
          onSelectFile={openFileDialog}
        />
      </div>
    </div>
  );
};

export default FloorPlanView;
