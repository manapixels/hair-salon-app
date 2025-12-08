'use client';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createIDBPersister, MAX_PERSIST_AGE } from '@/lib/queryPersister';
import { getQueryClient } from '@/lib/queryClient';
import { ReactNode, useState } from 'react';

/**
 * Client-side query provider with persistence
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());
  const [persister] = useState(() => createIDBPersister());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: MAX_PERSIST_AGE,
        dehydrateOptions: {
          shouldDehydrateQuery: query => {
            // Only persist queries with data
            return query.state.status === 'success';
          },
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
