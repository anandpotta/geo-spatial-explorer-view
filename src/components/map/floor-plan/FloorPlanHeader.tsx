
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Upload } from "lucide-react";

interface FloorPlanHeaderProps {
  onBack: () => void;
  onUploadClick: () => void;
  hasSelectedImage: boolean;
}

const FloorPlanHeader = ({ onBack, onUploadClick, hasSelectedImage }: FloorPlanHeaderProps) => {
  return (
    <div className="absolute top-4 right-4 z-50 flex gap-2">
      <Button
        variant="outline"
        onClick={onBack}
        className="bg-white/80 backdrop-blur-sm"
      >
        <FlipHorizontal className="mr-2 h-4 w-4" />
        Back to Map
      </Button>
      <Button
        variant="outline"
        className="bg-white/80 backdrop-blur-sm"
        type="button"
        onClick={onUploadClick}
      >
        <Upload className="mr-2 h-4 w-4" />
        {hasSelectedImage ? 'Change Floor Plan' : 'Upload Floor Plan'}
      </Button>
    </div>
  );
};

export default FloorPlanHeader;
