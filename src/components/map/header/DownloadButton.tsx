
import React from 'react';
import { Button } from '@/components/ui/button';
import { downloadEnhancedGeoJSON, generateEnhancedGeoJSON } from '@/utils/enhanced-geojson-export';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  disabled?: boolean;
  searchLocation?: {
    latitude: number;
    longitude: number;
    searchString?: string;
  };
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ disabled = false, searchLocation }) => {
  const checkIfDataExists = () => {
    try {
      const geoJSON = generateEnhancedGeoJSON();
      const hasData = geoJSON.features && geoJSON.features.length > 0;
      console.log('GeoJSON data check:', { hasData, featureCount: geoJSON.features?.length || 0 });
      return hasData;
    } catch (error) {
      console.error('Error checking GeoJSON data:', error);
      return false;
    }
  };

  const handleDownload = () => {
    try {
      const hasData = checkIfDataExists();
      
      if (!hasData) {
        toast.error('No data available to download. Please add some markers or drawings first.');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `map-annotations-${timestamp}.geojson`;
      
      // Include search location in the download if available
      downloadEnhancedGeoJSON({
        searchLocation,
        includeSearchMetadata: true,
        filename
      });
      
      toast.success('Enhanced GeoJSON file downloaded successfully');
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      toast.error('Failed to download GeoJSON file');
    }
  };

  // Check if we have data to enable the button regardless of map ready state
  const hasDataToDownload = checkIfDataExists();
  const isButtonDisabled = disabled && !hasDataToDownload;

  console.log('Download button state:', { disabled, hasDataToDownload, isButtonDisabled });

  return (
    <Button
      onClick={handleDownload}
      disabled={isButtonDisabled}
      variant="outline"
      size="sm"
      className="bg-white hover:bg-gray-50 border border-gray-300 shadow-md relative z-[1002]"
      style={{ pointerEvents: 'auto' }}
    >
      <Download className="mr-2 h-4 w-4" />
      Download GeoJSON
    </Button>
  );
};

export default DownloadButton;
