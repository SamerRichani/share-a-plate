import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './app/App';
import { AuthProvider } from './context/AuthContext.jsx';
// Fonts are bundled with the site (no outside font server needed).
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
