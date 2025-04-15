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
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-md shadow-lg z-[10000] w-80">
      <h3 className="text-lg font-semibold mb-4">Save Building</h3>
      <input
        type="text"
        value={buildingName}
        onChange={(e) => onBuildingNameChange(e.target.value)}
        placeholder="Building Name"
        className="w-full p-2 border rounded-md mb-4"
      />
      <div className="flex justify-end gap-2">
        <button 
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button 
          onClick={onSave}
          disabled={!buildingName.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default BuildingDialog;
