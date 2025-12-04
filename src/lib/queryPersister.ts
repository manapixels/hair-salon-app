import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

/**
 * List of query keys that should be persisted to IndexedDB
 * Only static data that rarely changes
 */
const PERSISTABLE_QUERY_KEYS = [
  'services',
  'service-categories',
  'service-tags',
  'stylists-all', // All stylists (not filtered)
];

/**
 * Check if a query should be persisted based on its key
 */
function shouldPersistQuery(queryKey: unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }

  const firstKey = String(queryKey[0]);
  return PERSISTABLE_QUERY_KEYS.some(key => firstKey.startsWith(key));
}

/**
 * Create IDB persister with selective persistence
 */
export function createIDBPersister(): Persister {
  const IDB_KEY = 'hair-salon-query-cache';

  return {
    persistClient: async (client: PersistedClient) => {
      // Filter out non-persistable queries
      const filteredQueries = client.clientState.queries.filter(query =>
        shouldPersistQuery([...query.queryKey]),
      );

      const clientToPersist = {
        ...client,
        clientState: {
          ...client.clientState,
          queries: filteredQueries,
        },
      };

      await set(IDB_KEY, clientToPersist);
    },
    restoreClient: async () => {
      const persisted = await get<PersistedClient>(IDB_KEY);
      return persisted || undefined;
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}

/**
 * Maximum age for persisted cache (7 days)
 */
export const MAX_PERSIST_AGE = 1000 * 60 * 60 * 24 * 7;
