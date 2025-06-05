
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Edit2 } from 'lucide-react';

interface NewMarkerFormProps {
  markerName: string;
  setMarkerName: (name: string) => void;
  markerType: 'pin' | 'area' | 'building';
  setMarkerType: (type: 'pin' | 'area' | 'building') => void;
  onSave: (e?: React.MouseEvent) => void;
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
    if (!disabled) {
      // Focus with multiple attempts
      const focusAttempts = [50, 150, 300, 500];
      const timers = focusAttempts.map(delay => 
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
            console.log(`Input field focused at ${delay}ms`);
          }
        }, delay)
      );
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [disabled, markerName]);

  const handleSaveButtonClick = (e: React.MouseEvent) => {
    console.log('Save button clicked in form');
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !markerName.trim()) {
      console.log('Save prevented: disabled or empty name');
      return;
    }
    
    if (isEditing && existingMarkerId && onRename) {
      console.log('Renaming marker:', existingMarkerId, markerName);
      onRename(existingMarkerId, markerName);
    } else {
      console.log('Saving new marker:', markerName);
      onSave(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setMarkerName(e.target.value);
  };

  const handleTypeButtonClick = (type: 'pin' | 'area' | 'building') => (e: React.MouseEvent) => {
    console.log('Type button clicked:', type);
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setMarkerType(type);
    }
  };

  const handleFormClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && markerName.trim() && !disabled) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Enter key pressed, saving marker');
      if (isEditing && existingMarkerId && onRename) {
        onRename(existingMarkerId, markerName);
      } else {
        onSave();
      }
    }
  };

  return (
    <div 
      className="p-4" 
      onClick={handleFormClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Location Name</label>
        <Input 
          ref={inputRef}
          type="text"
          placeholder="Enter location name"
          value={markerName}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full"
          disabled={disabled}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      
      {!isEditing && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">Location Type</label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={markerType === 'pin' ? 'default' : 'outline'}
              className="flex-1 text-xs"
              onClick={handleTypeButtonClick('pin')}
              disabled={disabled}
            >
              Pin
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'area' ? 'default' : 'outline'}
              className="flex-1 text-xs"
              onClick={handleTypeButtonClick('area')}
              disabled={disabled}
            >
              Area
            </Button>
            <Button
              type="button"
              size="sm"
              variant={markerType === 'building' ? 'default' : 'outline'}
              className="flex-1 text-xs"
              onClick={handleTypeButtonClick('building')}
              disabled={disabled}
            >
              Building
            </Button>
          </div>
        </div>
      )}
      
      <Button 
        onClick={handleSaveButtonClick}
        disabled={!markerName.trim() || disabled}
        className="w-full"
        size="sm"
        onMouseDown={(e) => e.stopPropagation()}
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
