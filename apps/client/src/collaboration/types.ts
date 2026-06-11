import * as Y from 'yjs';

export interface CollaborationUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  color?: string;
  colorLight?: string;
}

export interface CollaborationContextType {
  doc: Y.Doc | null;
  provider: any | null; // WebsocketProvider from y-websocket
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
}
