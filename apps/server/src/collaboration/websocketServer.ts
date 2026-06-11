import { Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { authenticateSocket } from './authSocket';
import { handleYjsConnection } from './yjsRoomManager';

export const setupWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ noServer: true });

  // Heartbeat mechanism to clean up stale connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  server.on('upgrade', async (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      
      // Match route: /collaboration/:roomId
      const match = url.pathname.match(/^\/collaboration\/([a-zA-Z0-9_-]+)$/);
      if (!match) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }

      const roomId = match[1];

      // Authenticate
      await authenticateSocket(request, roomId);

      // Upgrade connection
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, roomId);
      });
    } catch (error: any) {
      if (error.message === 'Rate limit exceeded') {
        socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      } else {
        console.error('[WebSocket] Upgrade failed:', error);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      }
      socket.destroy();
    }
  });

  wss.on('connection', (ws: any, request: any, roomId: string) => {
    // console.log(`[WebSocket] Client connected to room: ${roomId}`);
    
    // Setup heartbeat for this socket
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Hand over the connection to Yjs Room Manager
    handleYjsConnection(ws, request, roomId);

    ws.on('close', () => {
      // console.log(`[WebSocket] Client disconnected from room: ${roomId}`);
    });
  });

  return wss;
};
