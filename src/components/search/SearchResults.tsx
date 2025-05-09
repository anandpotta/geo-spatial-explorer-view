
import { Search } from 'lucide-react';
import { Location } from '@/utils/geo-utils';

interface SearchResultsProps {
  results: Location[];
  show: boolean;
  onSelect: (location: Location) => void;
}

const SearchResults = ({ results, show, onSelect }: SearchResultsProps) => {
  if (!show || results.length === 0) return null;
  
  return (
    <ul 
      className="absolute z-50 w-full bg-card border rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto"
    >
      {results.map((location) => (
        <li 
          key={location.id} 
          className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center"
          onClick={() => onSelect(location)}
        >
          <Search size={14} className="mr-2 text-muted-foreground" />
          {location.label}
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;
