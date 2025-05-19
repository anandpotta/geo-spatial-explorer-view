
import React from 'react';
import { Trash2, Pencil } from 'lucide-react';

interface ToolButtonsProps {
  activeButton: string | null;
  onToolClick: (tool: string) => void;
}

const ToolButtons: React.FC<ToolButtonsProps> = ({ 
  activeButton, 
  onToolClick 
}) => {
  return (
    <>
      {/* Edit button */}
      <button
        className={`w-full p-2 rounded-md mb-2 flex items-center justify-center transition-colors ${activeButton === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        onClick={() => onToolClick('edit')}
        aria-label="Edit shapes"
      >
        <Pencil className="h-5 w-5" />
        <span className="ml-2">Edit</span>
      </button>
      
      <button
        className="w-full p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center"
        onClick={() => onToolClick('clear')}
        aria-label="Clear all layers"
      >
        <Trash2 className="h-5 w-5" />
        <span className="ml-2">Clear All</span>
      </button>
    </>
  );
};

export default ToolButtons;
