import React from 'react';
import { createRoot } from 'react-dom/client';
import BankingWorkspace from './BankingWorkspace.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BankingWorkspace />
  </React.StrictMode>
);
