
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface RemoveButtonProps {
  onClick: () => void;
  className?: string;
}

const RemoveButton = ({ onClick, className = '' }: RemoveButtonProps) => {
  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      variant="destructive"
      size="icon"
      className={`absolute -top-2 -right-2 h-6 w-6 rounded-full p-0.5 ${className}`}
    >
      <XCircle className="h-5 w-5" />
    </Button>
  );
};

export default RemoveButton;
