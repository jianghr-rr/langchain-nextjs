"use client";

import type { ReactNode } from 'react';
import { SessionProvider } from '~/context/graph-robot-session-context';
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
