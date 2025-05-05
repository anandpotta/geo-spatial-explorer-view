
import DrawingToolbar from './drawing-tools/DrawingToolbar';

interface DrawingToolsProps {
  onToolSelect: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onClearAll?: () => void;
}

const DrawingTools = (props: DrawingToolsProps) => {
  return <DrawingToolbar {...props} />;
};

export default DrawingTools;
