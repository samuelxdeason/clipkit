import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Foundation } from './app/foundation';
import '../styled-system/styles.css';
import '@clipkit/ui/fonts.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Foundation />
  </StrictMode>,
);
