import { LucideIcon } from "lucide-react";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DrawingToolButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
}

const DrawingToolButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  className = "",
  isActive = false
}: DrawingToolButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={`p-2 rounded-md transition-colors w-full flex items-center justify-center ${
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary hover:bg-secondary/80"
            } ${className}`}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DrawingToolButton;
