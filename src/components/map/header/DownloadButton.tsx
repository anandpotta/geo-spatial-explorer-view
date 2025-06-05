
import React, { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { downloadGeoJSON, generateGeoJSON } from '@/utils/geojson-export';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  disabled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ disabled = false }) => {
  // Memoize the data check to prevent excessive calls
  const hasDataToDownload = useMemo(() => {
    try {
      const geoJSON = generateGeoJSON();
      const hasData = geoJSON.features && geoJSON.features.length > 0;
      return hasData;
    } catch (error) {
      console.error('Error checking GeoJSON data:', error);
      return false;
    }
  }, []); // Only check once on mount

  const handleDownload = useCallback(() => {
    try {
      // Re-check data at download time
      const geoJSON = generateGeoJSON();
      const hasData = geoJSON.features && geoJSON.features.length > 0;
      
      if (!hasData) {
        toast.error('No data available to download. Please add some markers or drawings first.');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `map-annotations-${timestamp}.geojson`;
      
      downloadGeoJSON(filename);
      
      toast.success('GeoJSON file downloaded successfully');
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      toast.error('Failed to download GeoJSON file');
    }
  }, []);

  const isButtonDisabled = disabled && !hasDataToDownload;

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

// Memoize the entire component to prevent unnecessary re-renders
export default React.memo(DownloadButton);
