import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export function useLessonsLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['public', 'leaderboard', 'lessons', limit],
    queryFn: () => api.get(`/public/leaderboard/lessons?limit=${limit}`).then((d) => d.data),
  });
}

export function useModulesLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['public', 'leaderboard', 'modules', limit],
    queryFn: () => api.get(`/public/leaderboard/modules?limit=${limit}`).then((d) => d.data),
  });
}
