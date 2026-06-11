import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CollaborationContextType } from './types';

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  roomId: string;
  token: string | null;
  children: React.ReactNode;
}

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};
const WS_URL = getWsUrl();

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  roomId,
  token,
  children,
}) => {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<CollaborationContextType['status']>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Y.Doc
    const ydoc = new Y.Doc();
    setDoc(ydoc);

    // Initialize WebsocketProvider
    const wsUrlPath = token 
      ? `collaboration/${roomId}?token=${encodeURIComponent(token)}`
      : `collaboration/${roomId}`;
      
    // The 3rd param is the room name, which we pass as roomId but the URL itself determines routing
    const wsProvider = new WebsocketProvider(WS_URL, wsUrlPath, ydoc, {
      connect: true,
    });

    setProvider(wsProvider);

    wsProvider.on('status', (event: { status: string }) => {
      console.log('[CollaborationProvider] WS status:', event.status);
      setStatus(event.status as 'connected' | 'disconnected');
    });

    wsProvider.on('connection-error', (event: any) => {
      console.error('[CollaborationProvider] WS connection error:', event);
      setError('Connection failed. You might be unauthorized.');
      setStatus('error');
    });

    return () => {
      wsProvider.disconnect();
      wsProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId, token]);

  return (
    <CollaborationContext.Provider value={{ doc, provider, status, error }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaborationContext = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaborationContext must be used within a CollaborationProvider');
  }
  return context;
};
