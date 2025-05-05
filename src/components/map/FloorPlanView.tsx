
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/drawing-utils";
import { saveFloorPlan, getFloorPlanById } from "@/utils/floor-plan-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [clipImage, setClipImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("floor-plan");
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlan = getFloorPlanById(drawing.id);
      if (savedFloorPlan) {
        setSelectedImage(savedFloorPlan.data);
        setIsPdf(savedFloorPlan.isPdf);
        setFileName(savedFloorPlan.fileName);
        
        // Check if there's a clip image
        if (savedFloorPlan.clipImage) {
          setClipImage(savedFloorPlan.clipImage);
        }
      } else {
        // Reset state if no floor plan is found
        setSelectedImage(null);
        setClipImage(null);
        setIsPdf(false);
        setFileName('');
      }
    }
  }, [drawing]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'floor-plan' | 'map-overlay') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Don't allow PDFs for map overlays
    if (fileType === 'map-overlay' && file.type.includes('pdf')) {
      toast.error('Please upload an image file for map overlays');
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
        
        if (fileType === 'floor-plan') {
          setSelectedImage(dataUrl);
          // Save to utils for this specific building
          saveFloorPlan(
            drawing.id,
            dataUrl,
            file.type.includes('pdf'),
            file.name,
            clipImage
          );
        } else {
          setClipImage(dataUrl);
          // Save the clip image to the floor plan
          saveFloorPlan(
            drawing.id,
            selectedImage || '',
            isPdf,
            fileName,
            dataUrl
          );
          
          // Dispatch the floorPlanUpdated event to refresh the map
          window.dispatchEvent(new Event('floorPlanUpdated'));
        }
        
        toast.success(fileType === 'floor-plan' ? 
          'Floor plan uploaded successfully' : 
          'Map overlay uploaded successfully');
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
      </div>
      
      <div className="w-full h-full flex flex-col items-center justify-start pt-16 bg-black/5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
            <TabsTrigger value="map-overlay">Map Overlay</TabsTrigger>
          </TabsList>
          
          <TabsContent value="floor-plan" className="mt-6">
            <div className="space-y-4 text-center max-w-[90%] mx-auto">
              <h2 className="text-xl font-semibold">
                {drawing?.properties?.name || 'Floor Plan View'} 
                {fileName && activeTab === 'floor-plan' && 
                  <span className="text-sm font-normal ml-2 text-gray-500">({fileName})</span>
                }
              </h2>
              
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'floor-plan')}
                  />
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm"
                    type="button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
                  </Button>
                </label>
              </div>
              
              {selectedImage ? (
                <div className="w-full max-h-[75vh] overflow-hidden rounded-lg shadow-lg border border-gray-200">
                  {isPdf ? (
                    <iframe 
                      src={selectedImage} 
                      className="w-full h-[70vh]" 
                      title="PDF Floor Plan"
                    />
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
          </TabsContent>
          
          <TabsContent value="map-overlay" className="mt-6">
            <div className="space-y-4 text-center max-w-[90%] mx-auto">
              <h2 className="text-xl font-semibold">
                {drawing?.properties?.name || 'Map Overlay'} 
                <span className="text-sm font-normal ml-2 text-gray-500">
                  (Image will be clipped to the shape)
                </span>
              </h2>
              
              <div className="flex justify-center mb-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'map-overlay')}
                  />
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm"
                    type="button"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {clipImage ? 'Change Overlay Image' : 'Upload Map Overlay'}
                  </Button>
                </label>
              </div>
              
              {clipImage ? (
                <div className="w-full max-h-[75vh] overflow-hidden rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Image Preview</h3>
                      <p className="text-sm text-gray-600">
                        This image will be clipped to the shape on the map. Return to the map to see the effect.
                      </p>
                    </div>
                    <img
                      src={clipImage}
                      alt="Map Overlay"
                      className="max-h-[40vh] max-w-full object-contain rounded-lg shadow-sm border border-gray-200"
                    />
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>How this works:</strong> This image will be displayed inside the shape you drew 
                        on the map using SVG clip-path. To see the effect, click "Back to Map".
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
                  <div className="flex flex-col items-center gap-4">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-medium">Upload Map Overlay</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      Upload an image to display inside the shape on the map
                    </p>
                    <Button 
                      onClick={() => {
                        const fileInput = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FloorPlanView;
