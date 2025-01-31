'use client'

import './globals.css';
import { useEffect, useState } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';
import { APIOnlineContext, ModelsContext } from '@/contexts/contexts';

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  useEffect(() => {
    checkModels();
    setInterval(() => checkModels(), 10000);
  }, []);

  const checkModels = async () => {
    try {
      const response = await ollama.list();
      const models = response.models;
      setApiIsOnline(true);
      setModels(models);
    } catch {
      setApiIsOnline(false);
      setModels([]);
    }
  };

  return (
    <html lang="en">
      <body>
        <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
        <APIOnlineContext.Provider value={apiIsOnline}>
          <ModelsContext.Provider value={models}>
            {children}
          </ModelsContext.Provider>
        </APIOnlineContext.Provider>
      </body>
    </html>
  );
};