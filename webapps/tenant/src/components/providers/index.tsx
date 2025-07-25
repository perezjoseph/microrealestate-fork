'use client';
import LocaleProvider from '@/utils/i18n/client/LocaleProvider';
import { ThemeProvider } from './ThemeProvider';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
