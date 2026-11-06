import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { WorkspaceProvider } from '../context/WorkspaceContext';

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
