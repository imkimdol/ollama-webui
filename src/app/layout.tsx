'use client'

import { CurrentChatIDContext, SetCurrentChatIDContext } from '@/misc';
import './globals.css';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  const [currentChatID, setCurrentChatID] = useState<string | null>(null);

  return (
    <html lang="en">
      <body>
        <Sidebar currentChatID={currentChatID} setCurrentChatID={setCurrentChatID} />
        <CurrentChatIDContext.Provider value={currentChatID}>
          <SetCurrentChatIDContext.Provider value={setCurrentChatID}>
            {children}
          </SetCurrentChatIDContext.Provider>
        </CurrentChatIDContext.Provider>
      </body>
    </html>
  );
};