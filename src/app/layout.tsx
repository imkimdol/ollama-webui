'use client'

import { CurrentChatIDContext, SetCurrentChatIDContext } from '@/misc';
import './globals.css';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: Readonly<{children: React.ReactNode;}>) {
  const [currentChatID, setCurrentChatID] = useState<string | null>(null);

  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className='flex'>
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