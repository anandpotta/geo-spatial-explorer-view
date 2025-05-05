
import { Edit3 } from 'lucide-react';

interface EditLayersButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const EditLayersButton = ({ isActive, onClick }: EditLayersButtonProps) => {
  return (
    <button
      className={`w-full p-2 rounded-md ${isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors flex items-center justify-center`}
      onClick={onClick}
      aria-label="Edit layers"
    >
      <Edit3 className="h-5 w-5 mr-2" />
      <span>{isActive ? 'Editing Active' : 'Edit Layers'}</span>
    </button>
  );
};

export default EditLayersButton;
