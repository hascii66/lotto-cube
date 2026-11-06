import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { PreferencesProvider } from './components/Preferences';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>,
);
