import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(tenantId?: string, tokenId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(18); // Default fallback latency display

  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);

      if (tenantId) {
        socket.emit('join_tenant', tenantId);
      }
      if (tokenId) {
        socket.emit('join_token', tokenId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Latency Ping interval
    const interval = setInterval(() => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('ping_check', start, () => {
          const duration = Date.now() - start;
          setLatencyMs(duration);
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [tenantId, tokenId]);

  return {
    socket: socketRef.current,
    isConnected,
    latencyMs,
  };
}
