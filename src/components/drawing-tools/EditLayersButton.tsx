
import { Edit3 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EditLayersButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const EditLayersButton = ({ isActive, onClick }: EditLayersButtonProps) => {
  const [forceActive, setForceActive] = useState(false);
  
  // Listen for custom event to set button as active
  useEffect(() => {
    const handleSetEditActive = () => {
      setForceActive(true);
    };
    
    // Check local storage for floor plans to determine if button should be active
    const checkFloorPlans = () => {
      try {
        const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
        if (Object.keys(floorPlans).length > 0) {
          setForceActive(true);
        }
      } catch (e) {
        console.error("Error checking floor plans:", e);
      }
    };
    
    window.addEventListener('set-edit-active', handleSetEditActive);
    window.addEventListener('storage', checkFloorPlans);
    
    // Initial check
    checkFloorPlans();
    
    return () => {
      window.removeEventListener('set-edit-active', handleSetEditActive);
      window.removeEventListener('storage', checkFloorPlans);
    };
  }, []);

  // Determine active state from props or forced state
  const buttonActive = isActive || forceActive;
  
  return (
    <button
      className={`w-full p-2 rounded-md ${buttonActive ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors flex items-center justify-center`}
      onClick={() => {
        onClick();
        setForceActive(true); // Always activate when clicked
      }}
      aria-label="Edit layers"
    >
      <Edit3 className="h-5 w-5 mr-2" />
      <span>{buttonActive ? 'Editing Active' : 'Edit Layers'}</span>
    </button>
  );
};

export default EditLayersButton;
