import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const homeModulesKey = ['public', 'courses', 'home'];

export function useHomeModules() {
  return useQuery({
    queryKey: homeModulesKey,
    queryFn: () => api.get('/public/courses/random?limit=4').then((d) => d.data),
  });
}

export function useAllModules(limit = 6) {
  return useInfiniteQuery({
    queryKey: ['public', 'courses', 'all', limit],
    queryFn: ({ pageParam }) => api.get(`/public/courses?page=${pageParam}&limit=${limit}`).then((d) => d),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined),
    select: (data) => {
      const seen = new Set();
      const modules = [];
      for (const page of data.pages) {
        for (const course of page.data.courses) {
          if (seen.has(course.id)) continue;
          seen.add(course.id);
          modules.push(course);
        }
      }
      return { modules, total: data.pages[0]?.meta?.total ?? 0 };
    },
  });
}

export function useModuleDetail(slug) {
  return useQuery({
    queryKey: ['public', 'courses', 'detail', slug],
    queryFn: () => api.get(`/public/courses/${slug}`).then((d) => d.data),
    enabled: Boolean(slug),
    retry: (failureCount, error) => (error?.status === 404 ? false : failureCount < 2),
  });
}
