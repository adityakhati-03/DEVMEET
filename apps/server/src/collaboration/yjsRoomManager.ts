import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';
import { CollaborationDocument } from '../models/collaboration.model';
import { redis, redisSubscriber } from '../config/redis';

// Access the underlying docs map from y-websocket utils to manage lifecycle
const { docs, setPersistence } = require('y-websocket/bin/utils');

/**
 * Configure MongoDB Persistence for y-websocket
 */
setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    // Attempt to load existing document state from MongoDB
    try {
      const dbDoc = await CollaborationDocument.findOne({ roomId: docName });
      if (dbDoc && dbDoc.yjsState) {
        Y.applyUpdate(ydoc, new Uint8Array(dbDoc.yjsState));
      }
    } catch (error) {
      console.error(`[Yjs] Failed to load document state for room ${docName}:`, error);
    }

    // -- Redis Pub/Sub Scaling --
    const channel = `yjs:room:${docName}`;

    // 1. Subscribe to Redis updates from other servers
    redisSubscriber.subscribe(channel, (err) => {
      if (err) console.error(`[Yjs] Failed to subscribe to ${channel}`, err);
    });

    const messageHandler = (ch: string, message: string) => {
      if (ch === channel) {
        try {
          const update = Buffer.from(message, 'base64');
          // Apply update from Redis (origin='redis' prevents echo loop)
          Y.applyUpdate(ydoc, new Uint8Array(update), 'redis');
        } catch (e) {
          console.error(`[Yjs] Failed to apply remote update on ${channel}`, e);
        }
      }
    };
    redisSubscriber.on('message', messageHandler);

    // 2. Publish local updates to Redis
    ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Don't echo updates that originated from Redis
      if (origin !== 'redis') {
        const payload = Buffer.from(update).toString('base64');
        redis.publish(channel, payload).catch(e => {
          console.error(`[Yjs] Failed to publish update to ${channel}`, e);
        });
      }
    });

    // Clean up subscriber when doc is destroyed
    ydoc.on('destroy', () => {
      redisSubscriber.off('message', messageHandler);
      redisSubscriber.unsubscribe(channel).catch(() => {});
      redisSubscriber.unsubscribe(`room:execution:${docName}`).catch(() => {});
    });

    // 3. Subscribe to Execution Worker results
    const execChannel = `room:execution:${docName}`;
    redisSubscriber.subscribe(execChannel, (err) => {
      if (err) console.error(`[Yjs] Failed to subscribe to ${execChannel}`, err);
    });

    const execMessageHandler = (ch: string, message: string) => {
      if (ch === execChannel) {
        try {
          const result = JSON.parse(message);
          const metadata = ydoc.getMap('metadata');
          
          // Use Yjs transaction to bundle updates
          ydoc.transact(() => {
            metadata.set('lastExecution', result);
          }, 'server');
        } catch (e) {
          console.error(`[Yjs] Failed to apply execution result to Ydoc`, e);
        }
      }
    };
    redisSubscriber.on('message', execMessageHandler);
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    // Save document state to MongoDB when all clients disconnect
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await CollaborationDocument.findOneAndUpdate(
        { roomId: docName },
        {
          roomId: docName,
          yjsState: Buffer.from(state),
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error(`[Yjs] Failed to save document state for room ${docName}:`, error);
    }
  }
});

export const handleYjsConnection = (conn: any, req: any, docName: string) => {
  setupWSConnection(conn, req, { docName });
};
