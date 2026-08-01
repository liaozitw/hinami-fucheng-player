import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import SupportFooter from './SupportFooter';
import { I18nProvider } from './i18n';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      {window.location.pathname.startsWith('/admin') ? <Admin /> : <App />}
      <SupportFooter />
    </I18nProvider>
  </React.StrictMode>,
);
