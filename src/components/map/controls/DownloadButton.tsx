
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { generateGeoJSON, downloadGeoJSON } from '@/utils/export/geo-export';
import { DrawingData } from '@/utils/drawings/types';
import { LocationMarker } from '@/utils/markers/types';

interface DownloadButtonProps {
  drawings: DrawingData[];
  markers: LocationMarker[];
  className?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  drawings,
  markers,
  className = ''
}) => {
  const handleDownload = () => {
    try {
      if (!drawings.length && !markers.length) {
        toast.info("No map data to export. Add some drawings or markers first.");
        return;
      }
      
      // Generate GeoJSON from drawings and markers
      const geoJSON = generateGeoJSON(drawings, markers);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const filename = `map-annotations-${timestamp}.geojson`;
      
      // Download the file
      downloadGeoJSON(geoJSON, filename);
      
      toast.success("GeoJSON file downloaded successfully");
    } catch (error) {
      console.error("Error exporting GeoJSON:", error);
      toast.error("Failed to export GeoJSON. Please try again.");
    }
  };
  
  return (
    <Button 
      onClick={handleDownload}
      variant="outline"
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      title="Download GeoJSON data"
    >
      <Download className="h-4 w-4" />
      <span>Export GeoJSON</span>
    </Button>
  );
};

export default DownloadButton;
