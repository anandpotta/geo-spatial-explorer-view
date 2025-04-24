
import { Button } from "@/components/ui/button";
import { FlipHorizontal } from "lucide-react";

interface FloorPlanViewProps {
  onBack: () => void;
}

const FloorPlanView = ({ onBack }: FloorPlanViewProps) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-50">
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
        <img
          src="https://images.unsplash.com/photo-1473177104440-ffee2f376098"
          alt="Floor Plan"
          className="max-h-[90%] max-w-[90%] object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default FloorPlanView;
