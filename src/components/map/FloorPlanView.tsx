import { useState, useEffect } from "react";
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      setIsLoading(true);

      const loadFloorPlan = async () => {
        const savedFloorPlan = await getFloorPlanById(drawing.id);
        if (savedFloorPlan) {
          setSelectedImage(savedFloorPlan.data);
          setIsPdf(savedFloorPlan.isPdf);
          setFileName(savedFloorPlan.fileName);
          setZoom(savedFloorPlan.zoom || 1);
          setRotation(savedFloorPlan.rotation || 0);
        } else {
          setSelectedImage(null);
          setIsPdf(false);
          setFileName('');
          setZoom(1);
          setRotation(0);
        }
        setIsLoading(false);
      };

      loadFloorPlan();
    }
  }, [drawing]);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Check file size - warn if over 1MB
    if (file.size > 1024 * 1024) {
      toast('Large file detected, processing may take a moment...', {
        duration: 3000
      });
      
      // Early warning for very large files
      if (file.size > 4 * 1024 * 1024) {
        toast.warning('File size exceeds 4MB and may not be stored properly');
      }
    }
    
    setIsUploading(true);
    
    try {
      // Save file name and check if it's a PDF
      setFileName(file.name);
      setIsPdf(file.type.includes('pdf'));
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result;
        if (result && drawing?.id) {
          const dataUrl = result as string;
          
          // Save to utils for this specific building
          const success = saveFloorPlan(
            drawing.id,
            {
              data: dataUrl,
              isPdf: file.type.includes('pdf'),
              fileName: file.name
            }
          );
          
          if (success) {
            setSelectedImage(dataUrl);
            // Success toast is handled in saveFloorPlan function
            
            // Trigger a custom event to ensure clip masks are applied
            window.dispatchEvent(new CustomEvent('floorPlanUpdated', {
              detail: { drawingId: drawing.id }
            }));
          } else {
            // Error toast is handled in saveFloorPlan function
            console.log('Failed to save floor plan due to storage constraints');
          }
        }
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast.error('Failed to read uploaded file');
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing file:', err);
      toast.error('Failed to process upload');
      setIsUploading(false);
    }
  };

  // Helper function to calculate proper scaling for the image
  const calculateFitScale = (imgWidth: number, imgHeight: number, containerWidth: number, containerHeight: number) => {
    const widthRatio = containerWidth / imgWidth;
    const heightRatio = containerHeight / imgHeight;
    return Math.min(widthRatio, heightRatio, 1); // Never scale up, only down
  };

  useEffect(() => {
    // Only save if an image is loaded and a drawing is present
    if (selectedImage && drawing?.id) {
      // Save the current state (including zoom and rotation)
      saveFloorPlan(drawing.id, {
        data: selectedImage,
        isPdf,
        fileName,
        zoom,
        rotation,
      });
      // Optionally, you can show a toast or feedback here
      // toast.success('Floor plan view updated');
    }
    // Only trigger when zoom or rotation changes
  }, [zoom, rotation]);
  
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
        <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            variant="outline"
            className="bg-white/80 backdrop-blur-sm"
            type="button"
            disabled={isUploading}
            onClick={() => {
              // This will trigger the file input click
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading 
              ? 'Processing...' 
              : (selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan')}
          </Button>
        </label>
      </div>
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
            <p>Loading floor plan...</p>
          </div>
        ) : selectedImage ? (
          <div className="space-y-4 text-center max-w-[90%]">
            <h2 className="text-xl font-semibold">
              {drawing?.properties?.name || 'Floor Plan View'} 
              {fileName && <span className="text-sm font-normal ml-2 text-gray-500">({fileName})</span>}
            </h2>
            {/* Controls Sidebar */}
            {selectedImage && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 bg-white/80 rounded-lg shadow p-2">
                <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 3))} disabled={isLoading || !selectedImage}>
                  <span title="Zoom In">+</span>
                </Button>
                <Button size="icon" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} disabled={isLoading || !selectedImage}>
                  <span title="Zoom Out">-</span>
                </Button>
                <Button size="icon" variant="outline" onClick={() => setRotation(r => r - 90)} disabled={isLoading || !selectedImage}>
                  <span title="Rotate Left">&#8634;</span>
                </Button>
                <Button size="icon" variant="outline" onClick={() => setRotation(r => r + 90)} disabled={isLoading || !selectedImage}>
                  <span title="Rotate Right">&#8635;</span>
                </Button>
                <Button size="icon" variant="outline" onClick={() => { setZoom(1); setRotation(0); }} disabled={isLoading || !selectedImage}>
                  <span title="Reset">&#8635;&#8634;</span>
                </Button>
              </div>
            )}
            {/* Image */}
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
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s',
                  margin: '0 auto',
                  display: 'block'
                }}
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
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Processing...' : 'Select File'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanView;
