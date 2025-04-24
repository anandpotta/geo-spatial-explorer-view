
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';

interface DrawingToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

const DrawingToolButton = ({ 
  icon: Icon, 
  label, 
  isActive = false, 
  onClick 
}: DrawingToolButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={isActive ? 'default' : 'outline'} 
            size="icon" 
            onClick={onClick}
            className="map-toolbar-button"
          >
            <Icon size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DrawingToolButton;
