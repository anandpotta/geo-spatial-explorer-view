
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { saveFloorPlan, getFloorPlanById } from "@/utils/floor-plan-utils";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [pathData, setPathData] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlan = getFloorPlanById(drawing.id);
      if (savedFloorPlan) {
        setSelectedImage(savedFloorPlan.data);
        setIsPdf(savedFloorPlan.isPdf);
        setFileName(savedFloorPlan.fileName);
        
        // Get the path data if available
        if (savedFloorPlan.pathData) {
          setPathData(savedFloorPlan.pathData);
        }
      } else {
        // Reset state if no floor plan is found
        setSelectedImage(null);
        setIsPdf(false);
        setFileName('');
        setPathData('');
      }
    }
  }, [drawing]);
  
  // Create a unique ID for the clip path
  const clipPathId = `clip-path-${drawing?.id || 'default'}`;
  
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
      if (result && drawing?.id) {
        const dataUrl = result as string;
        setSelectedImage(dataUrl);
        
        // Save to utils for this specific building
        saveFloorPlan(
          drawing.id,
          dataUrl,
          file.type.includes('pdf'),
          file.name,
          pathData // Include the path data for clipping
        );
        
        toast.success('Floor plan uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function to calculate proper scaling for the image
  const calculateFitScale = (imgWidth: number, imgHeight: number, containerWidth: number, containerHeight: number) => {
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    return Math.min(widthRatio, heightRatio, 1); // Never scale up, only down
  };

  return (
    <div className="relative w-full h-full">
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
              // This will trigger the file input click
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
          </Button>
        </label>
      </div>
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-black/5">
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
              <div className="relative">
                {pathData ? (
                  <div className="relative max-h-[70vh]">
                    <svg 
                      ref={svgRef}
                      className="absolute top-0 left-0 w-full h-full" 
                      style={{ pointerEvents: 'none' }}
                    >
                      <defs>
                        <clipPath id={clipPathId}>
                          <path d={pathData} />
                        </clipPath>
                      </defs>
                    </svg>
                    <img
                      ref={imageRef}
                      src={selectedImage}
                      alt="Floor Plan"
                      className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                      style={{ clipPath: `url(#${clipPathId})` }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement;
                        const container = containerRef.current;
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
                  </div>
                ) : (
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Floor Plan"
                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const container = containerRef.current;
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
