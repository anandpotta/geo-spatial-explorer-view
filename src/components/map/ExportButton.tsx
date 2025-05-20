
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { DrawingData } from '@/utils/drawing-utils';
import { LocationMarker } from '@/utils/marker-utils';
import { exportGeoJSON } from '@/utils/export-utils';

interface ExportButtonProps {
  drawings: DrawingData[];
  markers: LocationMarker[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ drawings, markers }) => {
  const handleExport = () => {
    try {
      exportGeoJSON(drawings, markers);
      toast.success('GeoJSON exported successfully');
    } catch (error) {
      console.error('Error exporting GeoJSON:', error);
      toast.error('Failed to export GeoJSON');
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      className="absolute bottom-4 right-4 z-[1000] bg-white text-black hover:bg-gray-100"
    >
      <Download className="mr-2 h-4 w-4" />
      Export GeoJSON
    </Button>
  );
};

export default ExportButton;
