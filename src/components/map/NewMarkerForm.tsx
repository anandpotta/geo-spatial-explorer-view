
import React, { useEffect, useRef } from 'react';
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
  disabled?: boolean;
}

const NewMarkerForm = ({
  markerName,
  setMarkerName,
  markerType,
  setMarkerType,
  onSave,
  isEditing = false,
  existingMarkerId,
  onRename,
  disabled = false
}: NewMarkerFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus on input when component mounts
    const timer = setTimeout(() => {
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [disabled]);

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !markerName.trim()) return;
    
    if (isEditing && existingMarkerId && onRename) {
      onRename(existingMarkerId, markerName);
    } else {
      onSave();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMarkerName(e.target.value);
  };

  const handleTypeButtonClick = (type: 'pin' | 'area' | 'building') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setMarkerType(type);
    }
  };

  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="p-2" onClick={handleFormClick}>
      <Input 
        ref={inputRef}
        type="text"
        placeholder="Location name"
        value={markerName}
        onChange={handleInputChange}
        className="mb-2"
        disabled={disabled}
      />
      {!isEditing && (
        <div className="flex mb-2 gap-1">
          <Button
            type="button"
            size="sm"
            variant={markerType === 'pin' ? 'default' : 'outline'}
            className="flex-1"
            onClick={handleTypeButtonClick('pin')}
            disabled={disabled}
          >
            Pin
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'area' ? 'default' : 'outline'}
            className="flex-1"
            onClick={handleTypeButtonClick('area')}
            disabled={disabled}
          >
            Area
          </Button>
          <Button
            type="button"
            size="sm"
            variant={markerType === 'building' ? 'default' : 'outline'}
            className="flex-1"
            onClick={handleTypeButtonClick('building')}
            disabled={disabled}
          >
            Building
          </Button>
        </div>
      )}
      <Button 
        onClick={handleSaveButtonClick}
        disabled={!markerName.trim() || disabled}
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
  );
};

export default NewMarkerForm;
