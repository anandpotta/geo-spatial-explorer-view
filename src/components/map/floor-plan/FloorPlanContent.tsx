
import { useState, useEffect } from "react";
import { DrawingData } from "@/utils/geo-utils";
import FloorPlanUploadSection from "./FloorPlanUploadSection";

interface FloorPlanContentProps {
  selectedImage: string | null;
  isPdf: boolean;
  fileName: string;
  drawingName?: string;
  onSelectFile: () => void;
}

const FloorPlanContent = ({ 
  selectedImage, 
  isPdf, 
  fileName, 
  drawingName,
  onSelectFile 
}: FloorPlanContentProps) => {
  // Helper function to calculate proper scaling for the image
  const calculateFitScale = (
    imgWidth: number, 
    imgHeight: number, 
    containerWidth: number, 
    containerHeight: number
  ) => {
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    return Math.min(widthRatio, heightRatio, 1); // Never scale up, only down
  };

  if (!selectedImage) {
    return <FloorPlanUploadSection onSelectFile={onSelectFile} />;
  }

  return (
    <div className="space-y-4 text-center max-w-[90%]">
      <h2 className="text-xl font-semibold">
        {drawingName || 'Floor Plan View'} 
        {fileName && <span className="text-sm font-normal ml-2 text-gray-500">({fileName})</span>}
      </h2>
      
      {isPdf ? (
        <div className="w-full max-h-[75vh] overflow-hidden rounded-lg shadow-lg border border-gray-200">
          <iframe 
            src={selectedImage} 
            className="w-full h-[70vh]" 
            title="PDF Floor Plan"
          />
        </div>
      ) : (
        <img
          src={selectedImage}
          alt="Floor Plan"
          className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            const container = img.parentElement?.parentElement;
            if (container) {
              const containerWidth = container.clientWidth * 0.9;
              const containerHeight = container.clientHeight * 0.7;
              const scale = calculateFitScale(img.naturalWidth, img.naturalHeight, containerWidth, containerHeight);
              if (scale < 1) {
                img.style.maxWidth = `${img.naturalWidth * scale}px`;
                img.style.maxHeight = `${img.naturalHeight * scale}px`;
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default FloorPlanContent;
