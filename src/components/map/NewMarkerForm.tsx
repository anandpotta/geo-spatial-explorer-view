
import React, { useEffect, useRef, useCallback, useState } from 'react';
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
  const [localValue, setLocalValue] = useState(markerName || '');
  
  useEffect(() => {
    // Focus on input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Sync local value with markerName prop when it changes externally
  useEffect(() => {
    if (markerName !== localValue) {
      setLocalValue(markerName || '');
    }
  }, [markerName]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Immediately update parent state
    setMarkerName(newValue);
    console.log('Input changed to:', newValue);
  }, [setMarkerName]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      if (localValue.trim()) {
        console.log('Enter pressed, saving with name:', localValue.trim());
        // Ensure parent state is updated with trimmed value
        setMarkerName(localValue.trim());
        
        if (isEditing && existingMarkerId && onRename) {
          onRename(existingMarkerId, localValue.trim());
        } else {
          onSave();
        }
      }
    }
  }, [localValue, isEditing, existingMarkerId, onRename, onSave, setMarkerName]);

  const handleSaveButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (localValue.trim()) {
      console.log('Save button clicked, saving with name:', localValue.trim());
      // Ensure parent state is updated with trimmed value
      setMarkerName(localValue.trim());
      
      if (isEditing && existingMarkerId && onRename) {
        onRename(existingMarkerId, localValue.trim());
      } else {
        onSave();
      }
    }
  }, [isEditing, existingMarkerId, onRename, localValue, onSave, setMarkerName]);

  const handleTypeChange = useCallback((type: 'pin' | 'area' | 'building') => {
    setMarkerType(type);
  }, [setMarkerType]);

  return (
    <Popup>
      <div className="p-2">
        <Input 
          ref={inputRef}
          type="text"
          placeholder="Location name"
          value={localValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
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
              onClick={() => handleTypeChange('pin')}
            >
              Pin
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'area' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleTypeChange('area')}
            >
              Area
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'building' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => handleTypeChange('building')}
            >
              Building
            </Button>
          </div>
        )}
        <Button 
          onClick={handleSaveButtonClick}
          disabled={!localValue.trim()}
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
