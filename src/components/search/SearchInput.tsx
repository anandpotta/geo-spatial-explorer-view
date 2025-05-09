
import { Input } from '@/components/ui/input';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading: boolean;
  onFocus: () => void;
}

const SearchInput = ({ 
  query, 
  onChange, 
  onClear,
  isLoading, 
  onFocus 
}: SearchInputProps) => {
  return (
    <div className="relative flex-1">
      <Input
        type="text"
        placeholder="Enter location to navigate..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        className="pr-8 pl-10 w-full"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="animate-spin" size={16} />
        </div>
      )}
      {query && !isLoading && (
        <button 
          type="button" 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
