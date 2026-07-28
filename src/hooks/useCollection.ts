import { useCallback, useEffect, useState } from 'react';
import type { Repository } from '../data/repository';
import type { SoftDeletable } from '../data/types';

/** Subscribes a component to a Repository, re-fetching whenever it changes. */
export function useCollection<T extends { id: string } & SoftDeletable>(
  repo: Repository<T>,
  includeDeleted = false,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    repo.list(includeDeleted).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [repo, includeDeleted]);

  useEffect(() => {
    reload();
    return repo.subscribe(reload);
  }, [repo, reload]);

  return { items, loading, reload };
}
