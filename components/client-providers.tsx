'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { GlobalNotificationProvider } from '@/components/notifications/GlobalNotificationProvider';
import { PWAStatusChecker } from '@/components/pwa-status-checker';
import { OfflineStatus } from '@/components/offline-status';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {/* Temporarily disabled to debug white screen issue */}
        {/* <GlobalNotificationProvider> */}
          {/* <PWAStatusChecker /> */}
          {/* <OfflineStatus /> */}
          <div style={{ paddingTop: 0, paddingBottom: '4rem' }}>
            {children}
          </div>
        {/* </GlobalNotificationProvider> */}
      </ThemeProvider>
    </SessionProvider>
  );
}
