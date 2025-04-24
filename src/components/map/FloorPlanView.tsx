
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";

interface FloorPlanViewProps {
  onBack: () => void;
  drawing?: any;
}

const FloorPlanView = ({ onBack, drawing }: FloorPlanViewProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      toast.success('Floor plan uploaded successfully');
    };
    reader.readAsDataURL(file);
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
      <div className="w-full h-full flex items-center justify-center bg-black/5">
        <div className="space-y-4 text-center">
          <h2 className="text-xl font-semibold">
            {drawing?.properties?.name || 'Floor Plan View'}
          </h2>
          
          {selectedImage ? (
            <img
              src={selectedImage}
              alt="Floor Plan"
              className="max-h-[70vh] max-w-[90%] object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <label className="cursor-pointer flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-gray-400" />
                <span className="text-gray-600">Click to upload floor plan</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button variant="outline">
                  Upload Floor Plan
                </Button>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanView;
