
import React, { useEffect, useRef, useState } from 'react';
import { Popup } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Edit2 } from 'lucide-react';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: () => void;
  isEditing?: boolean;
  existingMarkerId?: string;
  onRename?: (id: string, newName: string) => void;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isEditing = false,
  existingMarkerId,
  onRename
}: NewMarkerFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localInputValue, setLocalInputValue] = useState(markerName);
  
  // Initialize local input value with marker name
  useEffect(() => {
    setLocalInputValue(markerName);
  }, [markerName]);
  
  useEffect(() => {
    // Focus on input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Update parent marker name whenever local input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalInputValue(newValue);
    // Immediately update the parent state so tooltip can react
    setMarkerName(newValue);
  };

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure the marker name is set to the current input value
    setMarkerName(localInputValue);
    
    if (isEditing && existingMarkerId && onRename) {
      onRename(existingMarkerId, localInputValue);
    } else {
      // Small delay to ensure state is updated before saving
      setTimeout(() => {
        onSave();
      }, 50);
    }
  };

  return (
    <Popup>
      <div className="p-2">
        <Input 
          ref={inputRef}
          type="text"
          placeholder="Location name"
          value={localInputValue}
          onChange={handleInputChange}
          className="mb-2"
          autoFocus
        />
        {!isEditing && (
          <div className="flex mb-2">
            <Button
              type="button"
              size="sm"
              variant={markerType === 'pin' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMarkerType('pin')}
            >
              Pin
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'area' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMarkerType('area')}
            >
              Area
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'building' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setMarkerType('building')}
            >
              Building
            </Button>
          </div>
        )}
        <Button 
          onClick={handleSaveButtonClick}
          disabled={!localInputValue.trim()}
          className="w-full"
        >
          {isEditing ? (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename Location
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Location
            </>
          )}
        </Button>
      </div>
    </Popup>
  );
};

export default NewMarkerForm;
