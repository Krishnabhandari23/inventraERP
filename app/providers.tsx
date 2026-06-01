'use client';

import { ReactNode, useEffect } from 'react';
import { initTheme } from './theme.client';
import { TenantProvider } from '@/lib/tenant';
import { AuthProvider } from '@/lib/hooks/useAuth';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { initTheme(); }, []);
  return (
    <TenantProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TenantProvider>
  );
}
