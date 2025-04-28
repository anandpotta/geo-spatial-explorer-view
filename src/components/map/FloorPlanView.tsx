
import { useState, useRef } from "react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { useImageTransform } from '@/hooks/useImageTransform';
import { calculateFitScale } from '@/utils/image-transform-utils'; // Import the missing function
import FloorPlanControls from './FloorPlanControls';
import FloorPlanUpload from './FloorPlanUpload';
import EmptyFloorPlanState from './EmptyFloorPlanState';
import FloorPlanPreview from './FloorPlanPreview';

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const {
    rotation,
    scale,
    position,
    setPosition,
    handleRotateLeft,
    handleRotateRight,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleUpdateScale,
    saveTransformation
  } = useImageTransform({ drawingId: drawing?.id });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    setFileName(file.name);
    setIsPdf(file.type.includes('pdf'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const dataUrl = result as string;
        setSelectedImage(dataUrl);
        handleReset();
        
        if (drawing?.id) {
          const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          savedFloorPlans[drawing.id] = {
            data: dataUrl,
            isPdf: file.type.includes('pdf'),
            fileName: file.name,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
          toast.success('Floor plan uploaded successfully');
          setTimeout(() => {
            if (imageContainerRef.current && imageRef.current) {
              const container = imageContainerRef.current.getBoundingClientRect();
              const image = imageRef.current;
              const newScale = calculateFitScale(
                container.width,
                container.height,
                image.naturalWidth,
                image.naturalHeight
              );
              handleUpdateScale(newScale);
              setPosition({ x: 0, y: 0 });
            }
          }, 500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      saveTransformation();
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <FloorPlanUpload
        onBack={onBack}
        onFileSelect={handleFileUpload}
        selectedImage={selectedImage}
      />

      {!isPdf && selectedImage && (
        <FloorPlanControls
          scale={scale}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToBorders={() => {
            if (imageContainerRef.current && imageRef.current) {
              const container = imageContainerRef.current.getBoundingClientRect();
              const image = imageRef.current;
              const newScale = calculateFitScale(
                container.width,
                container.height,
                image.naturalWidth,
                image.naturalHeight
              );
              handleUpdateScale(newScale);
              setPosition({ x: 0, y: 0 });
              toast.success('Image fit to borders');
            }
          }}
          onReset={handleReset}
          onScaleChange={handleUpdateScale}
        />
      )}
      
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {selectedImage ? (
          <FloorPlanPreview
            selectedImage={selectedImage}
            isPdf={isPdf}
            fileName={fileName}
            title={drawing?.properties?.name || 'Floor Plan View'}
            containerRef={imageContainerRef}
            imageRef={imageRef}
            isDragging={isDragging}
            transformation={{ rotation, scale, position }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          />
        ) : (
          <EmptyFloorPlanState
            onSelectFile={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
