import { useCallback, useEffect, useState } from 'react';
import { getConfig, saveConfig } from '../data/db';
import type { AppConfig } from '../data/types';

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  const reload = useCallback(() => {
    getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (patch: Partial<AppConfig>) => {
      const current = config ?? (await getConfig());
      const next = { ...current, ...patch };
      await saveConfig(next);
      setConfig(next);
    },
    [config],
  );

  return { config, update, reload };
}
