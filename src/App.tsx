
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
      // Set a small timeout to ensure state is consistent after auth
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsAppReady(false);
    }
  }, [isAuthenticated]);
  
  console.log('AppContent render - authenticated:', isAuthenticated);
  
  return (
    <div className="h-screen flex flex-col">
      {isAuthenticated && <Header />}
      {isAuthenticated ? <Index key={isAppReady ? 'ready' : 'loading'} /> : <LoginPage />}
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
