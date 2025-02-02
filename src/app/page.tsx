'use client'

import { SetCurrentChatIDContext } from '@/misc';
import { useContext, useEffect } from 'react';

export default function Home() {
  const setCurrentChatID = useContext(SetCurrentChatIDContext);

  useEffect(() => {
    setCurrentChatID(null);
  }, []);

  return (
    <div>
    </div>
  );
};