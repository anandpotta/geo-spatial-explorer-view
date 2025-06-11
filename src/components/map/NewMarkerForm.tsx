
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
  onSave: (finalName?: string) => void;
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

  // Handle input changes without updating parent state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalInputValue(newValue);
    console.log('NewMarkerForm: Input changed to:', newValue);
  };

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('NewMarkerForm: Save button clicked with value:', localInputValue);
    
    if (isEditing && existingMarkerId && onRename) {
      console.log('NewMarkerForm: Renaming marker to:', localInputValue);
      onRename(existingMarkerId, localInputValue);
    } else {
      console.log('NewMarkerForm: Saving new marker with name:', localInputValue);
      // Update the marker name state first
      setMarkerName(localInputValue);
      // Pass the final name directly to onSave to avoid state timing issues
      onSave(localInputValue);
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
