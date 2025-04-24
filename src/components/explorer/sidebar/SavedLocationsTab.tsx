
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SavedLocations from '@/components/saved-locations/SavedLocations';

interface SavedLocationsTabProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocationsTab = ({ onLocationSelect }: SavedLocationsTabProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Saved Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <SavedLocations onLocationSelect={onLocationSelect} />
      </CardContent>
    </Card>
  );
};

export default SavedLocationsTab;
