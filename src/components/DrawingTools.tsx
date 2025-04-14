
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MapPin, 
  Pencil, 
  Square,
  Rectangle, 
  Circle, 
  Move, 
  RotateCw, 
  Trash2, 
  ZoomIn, 
  ZoomOut 
} from 'lucide-react';
import { toast } from 'sonner';

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const DrawingTools = ({ 
  onToolSelect, 
  onZoomIn, 
  onZoomOut, 
  onReset 
}: DrawingToolsProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const handleToolClick = (tool: string) => {
    const newActiveTool = tool === activeTool ? null : tool;
    setActiveTool(newActiveTool);
    onToolSelect(tool);
  };
  
  return (
    <div 
      className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-md"
      style={{ 
        zIndex: 20000,
        isolation: 'isolate',
        position: 'fixed'
      }}
    >
      <TooltipProvider>
        {/* Drawing Tools */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === 'marker' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => handleToolClick('marker')}
              className="map-toolbar-button"
            >
              <MapPin size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Add Marker</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === 'polygon' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => handleToolClick('polygon')}
              className="map-toolbar-button"
            >
              <Square size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Draw Polygon</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === 'rectangle' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => handleToolClick('rectangle')}
              className="map-toolbar-button"
            >
              <Rectangle size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Draw Rectangle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === 'circle' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => handleToolClick('circle')}
              className="map-toolbar-button"
            >
              <Circle size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Draw Circle</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={activeTool === 'pan' ? 'default' : 'outline'} 
              size="icon" 
              onClick={() => handleToolClick('pan')}
              className="map-toolbar-button"
            >
              <Move size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Pan</p>
          </TooltipContent>
        </Tooltip>
        
        {/* Map Controls */}
        <div className="h-4" /> {/* Spacer */}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onZoomIn}
              className="map-toolbar-button"
            >
              <ZoomIn size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Zoom In</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onZoomOut}
              className="map-toolbar-button"
            >
              <ZoomOut size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Zoom Out</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onReset}
              className="map-toolbar-button"
            >
              <RotateCw size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Reset View</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => handleToolClick('clear')}
              className="map-toolbar-button"
            >
              <Trash2 size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Clear All</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default DrawingTools;
