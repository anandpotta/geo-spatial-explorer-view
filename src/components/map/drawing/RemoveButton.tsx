
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface RemoveButtonProps {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

const RemoveButton = ({ onClick, className = '' }: RemoveButtonProps) => {
  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      variant="destructive"
      size="icon"
      className={`h-8 w-8 rounded-full p-1 shadow-md hover:bg-red-600 animate-pulse ${className}`}
    >
      <X className="h-6 w-6" strokeWidth={3} />
    </Button>
  );
};

export default RemoveButton;
