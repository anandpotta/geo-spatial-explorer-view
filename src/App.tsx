
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Index from './pages/Index';
import LoginPage from './components/auth/LoginPage';
import Header from './components/auth/Header';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);
  
  // Add an effect to handle post-auth initialization
  useEffect(() => {
    if (isAuthenticated) {
      console.log('AppContent: User is authenticated, preparing 3D view');
      // Set a small timeout to ensure DOM is ready before mounting the 3D view
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsAppReady(false);
    }
  }, [isAuthenticated]);
  
  // Force a remount of the Index component when authentication state changes
  // This ensures a clean initialization of all components, especially the 3D globe
  const indexKey = isAuthenticated ? `index-${isAppReady ? 'ready' : 'loading'}-${Date.now()}` : 'not-auth';
  
  console.log('AppContent render - authenticated:', isAuthenticated, 'ready:', isAppReady);
  
  return (
    <div className="h-screen flex flex-col">
      {isAuthenticated && <Header />}
      {isAuthenticated ? (
        <div className="flex-1 overflow-hidden">
          <Index key={indexKey} />
        </div>
      ) : (
        <LoginPage />
      )}
    </div>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
