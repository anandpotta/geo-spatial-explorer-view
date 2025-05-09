
import { AlertCircle } from 'lucide-react';

interface OfflineBannerProps {
  isVisible: boolean;
}

const OfflineBanner = ({ isVisible }: OfflineBannerProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="mb-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm flex items-center rounded">
      <AlertCircle className="mr-2 h-4 w-4" />
      <span>Working in offline mode. Limited search results available.</span>
    </div>
  );
};

export default OfflineBanner;
