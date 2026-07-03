import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../stores';
import { api } from '../lib/api';

export function useGameState<T>(defaultState: T) {
  const { token } = useAuthStore();
  const [state, setState] = useState<T>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Partial<T>>('/social/game', {}, token).then((s) => {
      setState({ ...defaultState, ...s });
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [token]);

  const save = useCallback(async (newState: T) => {
    setState(newState);
    await api('/social/game', { method: 'PUT', body: JSON.stringify({ state: newState }) }, token);
  }, [token]);

  return { state, setState, save, loaded };
}
