
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupAnalyticsBlocker } from './utils/analytics-blocker'

// Initialize the analytics blocker
setupAnalyticsBlocker();

createRoot(document.getElementById("root")!).render(<App />);
