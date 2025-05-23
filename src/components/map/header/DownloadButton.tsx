
import React from 'react';
import { Button } from '@/components/ui/button';
import { downloadGeoJSON } from '@/utils/geojson-export';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  disabled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ disabled = false }) => {
  const handleDownload = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `map-annotations-${timestamp}.geojson`;
      
      downloadGeoJSON(filename);
      
      toast.success('GeoJSON file downloaded successfully');
    } catch (error) {
      console.error('Error downloading GeoJSON:', error);
      toast.error('Failed to download GeoJSON file');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="bg-white hover:bg-gray-50 border border-gray-300 shadow-md cursor-pointer relative z-20 pointer-events-auto"
    >
      <Download className="mr-2 h-4 w-4" />
      Download GeoJSON
    </Button>
  );
};

export default DownloadButton;
