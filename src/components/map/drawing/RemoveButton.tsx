
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
      className={`h-5 w-5 rounded-full p-0 shadow-md hover:bg-red-600 ${className}`}
    >
      <X className="h-3 w-3" strokeWidth={3} />
    </Button>
  );
};

export default RemoveButton;
