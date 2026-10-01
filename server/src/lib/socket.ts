import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocket(server: HTTPServer, corsOrigin: string) {
  io = new SocketIOServer(server, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join tenant channel room
    socket.on('join_tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room: tenant:${tenantId}`);
    });

    // Join customer token room
    socket.on('join_token', (tokenId: string) => {
      socket.join(`token:${tokenId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined room: token:${tokenId}`);
    });

    // Ping check for latency indicator
    socket.on('ping_check', (clientTimestamp: number, callback: (serverTimestamp: number) => void) => {
      if (typeof callback === 'function') {
        callback(Date.now());
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

// Broadcast helper for Queue Advanced
export function broadcastQueueAdvanced(tenantId: string, payload: any) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit('QUEUE_ADVANCED', payload);
  }
}

// Broadcast helper for New Token Created
export function broadcastTokenCreated(tenantId: string, payload: any) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit('TOKEN_CREATED', payload);
  }
}

// Broadcast helper for Counter Status Changed
export function broadcastCounterChanged(tenantId: string, payload: any) {
  if (io) {
    io.to(`tenant:${tenantId}`).emit('COUNTER_CHANGED', payload);
  }
}

// Broadcast helper for Token Update
export function broadcastTokenUpdated(tokenId: string, payload: any) {
  if (io) {
    io.to(`token:${tokenId}`).emit('TOKEN_UPDATED', payload);
  }
}
