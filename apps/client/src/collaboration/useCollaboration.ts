import { useEffect, useState, useCallback } from 'react';
import { useCollaborationContext } from './CollaborationProvider';
import * as Y from 'yjs';
import { CollaborationUser } from './types';

// Shared replicated state backed by Y.Map('metadata')
export const useSharedState = <T>(key: string, defaultValue: T): [T, (val: T) => void] => {
  const { doc } = useCollaborationContext();
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (!doc) return;

    const metadata = doc.getMap('metadata');

    const updateValue = () => {
      const val = metadata.get(key) as T;
      if (val !== undefined) {
        setValue(val);
      }
    };

    updateValue();

    const observer = () => {
      updateValue();
    };

    metadata.observe(observer);

    return () => {
      metadata.unobserve(observer);
    };
  }, [doc, key]);

  const setSharedValue = useCallback(
    (newVal: T) => {
      if (!doc) return;
      const metadata = doc.getMap('metadata');
      metadata.set(key, newVal);
    },
    [doc, key]
  );

  return [value, setSharedValue];
};

// Local user awareness info (name, color, cursor position)
export const useSelfInfo = () => {
  const { provider } = useCollaborationContext();
  const [info, setInfo] = useState<CollaborationUser | null>(null);

  useEffect(() => {
    if (!provider) return;

    const updateInfo = () => {
      const state = provider.awareness.getLocalState();
      if (state && state.user) {
        setInfo(state.user as CollaborationUser);
      }
    };

    updateInfo();
    provider.awareness.on('update', updateInfo);

    return () => {
      provider.awareness.off('update', updateInfo);
    };
  }, [provider]);

  const setSelfInfo = useCallback(
    (userInfo: Partial<CollaborationUser>) => {
      if (!provider) return;
      const currentState = provider.awareness.getLocalState() || {};
      provider.awareness.setLocalState({
        ...currentState,
        user: { ...(currentState.user || {}), ...userInfo },
      });
    },
    [provider]
  );

  return { info, setSelfInfo };
};

// Other connected users' awareness info
export const useOthersInfo = () => {
  const { provider } = useCollaborationContext();
  const [others, setOthers] = useState<{ id: number; info: CollaborationUser }[]>([]);

  useEffect(() => {
    if (!provider) return;

    const updateOthers = () => {
      const states = Array.from(provider.awareness.getStates().entries()) as [number, any][];
      const localId = provider.awareness.clientID;
      
      const othersList = states
        .filter(([clientId, state]: [number, any]) => clientId !== localId && state.user)
        .map(([clientId, state]: [number, any]) => ({
          id: clientId,
          info: state.user as CollaborationUser,
        }));
      
      setOthers(othersList);
    };

    updateOthers();
    provider.awareness.on('update', updateOthers);

    return () => {
      provider.awareness.off('update', updateOthers);
    };
  }, [provider]);

  return others;
};
