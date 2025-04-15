
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BuildingDialogProps {
  show: boolean;
  buildingName: string;
  onBuildingNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const BuildingDialog = ({ 
  show, 
  buildingName, 
  onBuildingNameChange, 
  onSave, 
  onCancel 
}: BuildingDialogProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10002]">
      <div className="bg-background p-6 rounded-lg shadow-lg w-80 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Save Building</h3>
        <Input
          type="text"
          value={buildingName}
          onChange={(e) => onBuildingNameChange(e.target.value)}
          placeholder="Building Name"
          className="w-full mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={onSave}
            disabled={!buildingName.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuildingDialog;
