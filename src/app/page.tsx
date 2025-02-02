'use client'

import { SetCurrentChatIDContext } from '@/misc';
import Link from 'next/link';
import { useContext, useEffect } from 'react';

export default function Home() {
  const setCurrentChatID = useContext(SetCurrentChatIDContext);

  useEffect(() => {
    setCurrentChatID(null);
  }, []);

  return (
    <div>
      <Link href="/generate">Go to generate</Link>
    </div>
  );
};