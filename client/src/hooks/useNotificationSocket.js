import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '../lib/socket';

export function useNotificationSocket(userId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:user', userId);

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [userId, queryClient]);
}
