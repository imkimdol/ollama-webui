'use client'

import './globals.css';
import { useEffect, useState } from 'react';
import ollama, { ModelResponse } from 'ollama/browser';
import { APIOnlineContext, ModelsContext } from '@/contexts/values';
import { CheckAPIFuncContext } from '@/contexts/functions';

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  const [apiIsOnline, setApiIsOnline] = useState<boolean>(false);
  const [models, setModels] = useState<ModelResponse[]>([]);

  useEffect(() => {
    checkAPI();
    setInterval(() => checkAPI(), 10000);
  }, []);

  const checkAPI = async () => {
    setApiIsOnline(false);
    setModels([]);
    checkModels();
  };
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

  const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <APIOnlineContext.Provider value={apiIsOnline}>
      <ModelsContext.Provider value={models}>
      <CheckAPIFuncContext.Provider value={checkAPI}>
        {children}
      </CheckAPIFuncContext.Provider>
      </ModelsContext.Provider>
      </APIOnlineContext.Provider>
    );
  };

  return (
    <html lang="en">
      <body>
        <p>API is {apiIsOnline ? 'online' : 'offline'}</p>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
};