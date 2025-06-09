
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Trash2 } from 'lucide-react';

interface SavedLocation {
  id: string;
  name: string;
  position: [number, number];
  createdAt: Date;
}

interface SavedLocationsProps {
  onLocationSelect: (position: [number, number]) => void;
}

const SavedLocations = ({ onLocationSelect }: SavedLocationsProps) => {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);

  useEffect(() => {
    // Load saved locations from localStorage
    const loadSavedLocations = () => {
      try {
        const stored = localStorage.getItem('savedLocations');
        if (stored) {
          const locations = JSON.parse(stored).map((loc: any) => ({
            ...loc,
            createdAt: new Date(loc.createdAt)
          }));
          setSavedLocations(locations);
        }
      } catch (error) {
        console.error('Error loading saved locations:', error);
      }
    };

    loadSavedLocations();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadSavedLocations();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const deleteLocation = (id: string) => {
    const updatedLocations = savedLocations.filter(loc => loc.id !== id);
    setSavedLocations(updatedLocations);
    localStorage.setItem('savedLocations', JSON.stringify(updatedLocations));
  };

  if (savedLocations.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No saved locations yet</p>
        <p className="text-sm">Click on the map to save locations</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {savedLocations.map((location) => (
        <div
          key={location.id}
          className="flex items-center justify-between p-3 border rounded-md hover:bg-accent cursor-pointer"
          onClick={() => onLocationSelect(location.position)}
        >
          <div className="flex items-center space-x-3">
            <MapPin size={16} className="text-muted-foreground" />
            <div>
              <p className="font-medium">{location.name}</p>
              <p className="text-sm text-muted-foreground">
                {location.position[0].toFixed(4)}, {location.position[1].toFixed(4)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              deleteLocation(location.id);
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default SavedLocations;
