
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DrawingData } from "@/utils/geo-utils";
import { saveFloorPlan, getFloorPlanById } from "@/utils/floor-plan-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: DrawingData | null;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMapImage, setSelectedMapImage] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [mapFileName, setMapFileName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("floor-plan");
  
  // Check if there's a saved floor plan for this building in localStorage
  useEffect(() => {
    if (drawing?.id) {
      const savedFloorPlan = getFloorPlanById(drawing.id);
      if (savedFloorPlan) {
        setSelectedImage(savedFloorPlan.data);
        setIsPdf(savedFloorPlan.isPdf);
        setFileName(savedFloorPlan.fileName);
      } else {
        // Reset state if no floor plan is found
        setSelectedImage(null);
        setIsPdf(false);
        setFileName('');
      }
      
      // Check for map image in the drawing properties
      if (drawing.imageUrl) {
        setSelectedMapImage(drawing.imageUrl);
        setMapFileName("Map Overlay Image");
      }
    }
  }, [drawing]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isMapImage: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // For map images, only allow images, not PDFs
    if (isMapImage && !file.type.startsWith('image/')) {
      toast.error('Please upload an image file for map overlay');
      return;
    } else if (!isMapImage && !file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please upload an image or PDF file');
      return;
    }
    
    // Save file name and check if it's a PDF
    const isPdfFile = file.type.includes('pdf');
    if (isMapImage) {
      setMapFileName(file.name);
    } else {
      setFileName(file.name);
      setIsPdf(isPdfFile);
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (result && drawing?.id) {
        const dataUrl = result as string;
        
        if (isMapImage) {
          // Save map image to the drawing itself
          setSelectedMapImage(dataUrl);
          
          // Dispatch custom event to update the drawing with the image
          const event = new CustomEvent('updateDrawingImage', { 
            detail: { 
              drawingId: drawing.id, 
              imageUrl: dataUrl 
            } 
          });
          window.dispatchEvent(event);
          
          toast.success('Map overlay image uploaded');
        } else {
          // Regular floor plan
          setSelectedImage(dataUrl);
          try {
            // Save to utils for this specific building
            saveFloorPlan(
              drawing.id,
              dataUrl,
              isPdfFile,
              file.name
            );
            toast.success('Floor plan uploaded successfully');
          } catch (error) {
            console.error('Error saving floor plan:', error);
            toast.error('Failed to save floor plan. The file might be too large.');
          }
        }
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
      
      <div className="w-full h-full flex flex-col bg-black/5">
        <div className="bg-white p-4 shadow-sm">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
              <TabsTrigger value="map-overlay">Map Overlay</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1 flex items-center justify-center overflow-auto">
          <TabsContent value="floor-plan" className="w-full h-full flex items-center justify-center">
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
                
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e)}
                    />
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Change Floor Plan
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-medium">Upload Floor Plan</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Upload a floor plan image or PDF for this building
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e)}
                    />
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Select File
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map-overlay" className="w-full h-full flex items-center justify-center">
            {selectedMapImage ? (
              <div className="space-y-4 text-center max-w-[90%]">
                <h2 className="text-xl font-semibold">
                  Map Overlay Image
                  {mapFileName && <span className="text-sm font-normal ml-2 text-gray-500">({mapFileName})</span>}
                </h2>
                
                <img
                  src={selectedMapImage}
                  alt="Map Overlay"
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
                
                <div className="text-sm text-gray-500 max-w-md mx-auto">
                  <p>This image will be displayed inside the polygon shape on the map.</p>
                </div>
                
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                    />
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Change Overlay Image
                    </Button>
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/80">
                <div className="flex flex-col items-center gap-4">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                  <h3 className="text-lg font-medium">Upload Map Overlay</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Upload an image to display inside the polygon shape on the map
                  </p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                    />
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanView;
