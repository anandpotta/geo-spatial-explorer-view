
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { Slider } from "@/components/ui/slider";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [rotation, setRotation] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      if (savedFloorPlans[drawing.id]) {
        const savedData = savedFloorPlans[drawing.id];
        setSelectedImage(savedData.data);
        setIsPdf(savedData.isPdf);
        setFileName(savedData.fileName);
        
        // Load saved transformation values if available
        if (savedData.transformation) {
          setRotation(savedData.transformation.rotation || 0);
          setScale(savedData.transformation.scale || 1);
          setPosition(savedData.transformation.position || { x: 0, y: 0 });
        }
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
    
    // Save file name and check if it's a PDF
    setFileName(file.name);
    setIsPdf(file.type.includes('pdf'));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result) {
        const dataUrl = result as string;
        setSelectedImage(dataUrl);
        
        // Reset transformation values for new image
        setRotation(0);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        
        // Save to localStorage for this specific building
        if (drawing?.id) {
          const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
          savedFloorPlans[drawing.id] = {
            data: dataUrl,
            isPdf: file.type.includes('pdf'),
            fileName: file.name,
            timestamp: new Date().toISOString(),
            transformation: {
              rotation: 0,
              scale: 1,
              position: { x: 0, y: 0 }
            }
          };
          localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
          toast.success('Floor plan uploaded successfully');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Save current transformation state to localStorage
  const saveTransformation = () => {
    if (!drawing?.id) return;
    
    const savedFloorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
    if (savedFloorPlans[drawing.id]) {
      savedFloorPlans[drawing.id].transformation = {
        rotation,
        scale,
        position
      };
      localStorage.setItem('floorPlans', JSON.stringify(savedFloorPlans));
    }
  };

  // Handlers for image manipulation
  const handleRotateLeft = () => {
    setRotation((prev) => {
      const newRotation = prev - 15;
      setTimeout(saveTransformation, 100);
      return newRotation;
    });
  };

  const handleRotateRight = () => {
    setRotation((prev) => {
      const newRotation = prev + 15;
      setTimeout(saveTransformation, 100);
      return newRotation;
    });
  };

  const handleZoomIn = () => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.1, 3);
      setTimeout(saveTransformation, 100);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.1, 0.2);
      setTimeout(saveTransformation, 100);
      return newScale;
    });
  };

  const handleFitToBorders = () => {
    if (!imageContainerRef.current || !imageRef.current) return;
    
    const container = imageContainerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    // Calculate scale to fit within container while maintaining aspect ratio
    const containerAspect = container.width / container.height;
    const imageAspect = image.width / image.height;
    
    let newScale;
    if (containerAspect > imageAspect) {
      // Container is wider than image
      newScale = (container.height * 0.9) / (image.height / scale);
    } else {
      // Container is taller than image
      newScale = (container.width * 0.9) / (image.width / scale);
    }
    
    setScale(newScale);
    setPosition({ x: 0, y: 0 });
    setTimeout(saveTransformation, 100);
    toast.success('Image fit to borders');
  };

  const handleReset = () => {
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setTimeout(saveTransformation, 100);
    toast.info('Image reset to original position');
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
    
    setPosition({
      x: newX,
      y: newY
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
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-white/80 backdrop-blur-sm"
        >
          <FlipHorizontal className="mr-2 h-4 w-4" />
          Back to Map
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm"
            type="button"
            onClick={() => {
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
          </Button>
        </label>
      </div>

      {selectedImage && !isPdf && (
        <div className="absolute left-4 top-4 z-50 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md flex flex-col gap-2">
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={handleRotateLeft} title="Rotate Left">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleRotateRight} title="Rotate Right">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleFitToBorders} title="Fit to Borders">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Scale:</span>
            <Slider 
              value={[scale]} 
              min={0.2} 
              max={3} 
              step={0.05} 
              className="w-32"
              onValueChange={(values) => {
                setScale(values[0]);
                saveTransformation();
              }}
            />
            <span className="text-xs">{Math.round(scale * 100)}%</span>
          </div>
          <div>
            <span className="text-xs text-center block">Drag image to reposition</span>
          </div>
        </div>
      )}
      
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {selectedImage ? (
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
                    style={{
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
