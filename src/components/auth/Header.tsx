
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  
  return (
    <div className="bg-background shadow-md py-2 px-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">GeoSpatial Explorer</h1>
      {currentUser && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{currentUser.username}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );
};

export default Header;
