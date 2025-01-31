'use client'

import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Link href="/chat">Go to chat</Link>
      <Link href="/generate">Go to generate</Link>
    </div>
  );
};