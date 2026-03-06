import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '../lib/socket';

export function useCommunitySocket(communityId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!communityId) return;

    connectSocket();
    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:community', communityId);

    const handlePostCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    };

    const handlePostDeleted = () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    };

    const handleCommentCreated = (data) => {
      queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
    };

    const handlePointsAwarded = () => {
      queryClient.invalidateQueries({ queryKey: ['community-leaderboard', communityId] });
    };

    socket.on('post:created', handlePostCreated);
    socket.on('post:deleted', handlePostDeleted);
    socket.on('comment:created', handleCommentCreated);
    socket.on('points:awarded', handlePointsAwarded);

    return () => {
      socket.off('post:created', handlePostCreated);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('comment:created', handleCommentCreated);
      socket.off('points:awarded', handlePointsAwarded);
      socket.emit('leave:community', communityId);
    };
  }, [communityId, queryClient]);
}
