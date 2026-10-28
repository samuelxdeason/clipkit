import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Application } from './app/application';
import '../styled-system/styles.css';
import '@clipkit/ui/fonts.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
