
import { useState, useEffect } from 'react';
import { Image } from 'lucide-react';

const ImageControlStatus = () => {
  const [hasImagesWithControls, setHasImagesWithControls] = useState(false);
  
  // Check if we have any images with controls
  useEffect(() => {
    const checkForImages = () => {
      const floorPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
      setHasImagesWithControls(Object.keys(floorPlans).length > 0);
    };
    
    checkForImages();
    
    // Listen for storage changes and visibility changes
    window.addEventListener('storage', checkForImages);
    window.addEventListener('floorPlanUpdated', checkForImages);
    
    return () => {
      window.removeEventListener('storage', checkForImages);
      window.removeEventListener('floorPlanUpdated', checkForImages);
    };
  }, []);
  
  if (!hasImagesWithControls) {
    return null;
  }
  
  return (
    <>
      <div className="h-4" />
      <div className="w-full p-2 rounded-md bg-purple-500 text-white flex items-center justify-center">
        <Image className="h-5 w-5 mr-2" />
        <span className="text-sm">Image Controls Active</span>
      </div>
    </>
  );
};

export default ImageControlStatus;
