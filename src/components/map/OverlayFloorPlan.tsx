
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawingData } from '@/utils/geo-utils';
import { calculateFitScale } from '@/utils/image-transform-utils';
import { useImageTransform } from '@/hooks/useImageTransform';
import FloorPlanControls from './FloorPlanControls';
import FloorPlanUpload from './FloorPlanUpload';

interface OverlayFloorPlanProps {
  drawingId: string;
  coordinates: Array<[number, number]>;
  onBack: () => void;
  drawing?: DrawingData | null;
}

const OverlayFloorPlan = ({ drawingId, coordinates, onBack, drawing }: OverlayFloorPlanProps) => {
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
  } = useImageTransform({ drawingId });

  // Load saved floor plan
  useState(() => {
    if (drawingId) {
      const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      if (savedFloorPlans[drawingId]) {
        const savedData = savedFloorPlans[drawingId];
        setSelectedImage(savedData.data);
        setIsPdf(savedData.isPdf);
        setFileName(savedData.fileName);
      }
    }
  });

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
        
        if (drawingId) {
          const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          savedFloorPlans[drawingId] = {
            data: dataUrl,
            isPdf: file.type.includes('pdf'),
            fileName: file.name,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
          toast.success('Floor plan uploaded successfully');
          
          setTimeout(handleFitToBorders, 500);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFitToBorders = () => {
    if (!imageContainerRef.current || !imageRef.current) return;
    
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
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      saveTransformation();
    }
  };

  if (!selectedImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        <FloorPlanUpload
          onBack={onBack}
          onFileSelect={handleFileUpload}
          selectedImage={selectedImage}
        />
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium">Upload Floor Plan</h3>
            <p className="text-gray-600 text-center max-w-md">
              Click the Upload Floor Plan button above to add a floor plan image or PDF
            </p>
            <Button 
              onClick={() => {
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.click();
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      {!isPdf && (
        <FloorPlanControls
          scale={scale}
          onRotateLeft={handleRotateLeft}
          onRotateRight={handleRotateRight}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitToBorders={handleFitToBorders}
          onReset={handleReset}
          onScaleChange={handleUpdateScale}
        />
      )}
      
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        <div className="space-y-4 text-center max-w-[90%]">
          <h2 className="text-xl font-semibold">
            {drawing?.properties?.name || 'Floor Plan View'} 
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
            <div 
              ref={imageContainerRef}
              className="max-h-[70vh] max-w-full overflow-hidden rounded-lg shadow-lg border border-gray-200 bg-gray-50 relative"
              style={{
                width: "90%",
                height: "70vh",
                margin: "0 auto"
              }}
            >
              <div
                className={`absolute cursor-${isDragging ? 'grabbing' : 'grab'}`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Floor Plan"
                  className="max-h-[70vh] max-w-full object-contain"
                  style={{ pointerEvents: 'none' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverlayFloorPlan;
