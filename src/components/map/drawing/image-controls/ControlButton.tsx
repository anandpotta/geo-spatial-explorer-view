
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ControlButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  label?: string;
  ariaLabel: string;
  bgColor?: string;
}

/**
 * Reusable button component for image controls
 */
const ControlButton = ({ 
  onClick, 
  icon: Icon, 
  label, 
  ariaLabel,
  bgColor = "bg-blue-500" 
}: ControlButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-md ${bgColor} text-white hover:${bgColor.replace('bg-', 'bg-').replace('-500', '-600')} transition-colors flex items-center justify-center`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Icon size={16} className={label ? "mr-1" : ""} />
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
};

export default ControlButton;
