import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    retry: false,
    queryFn: () =>
      api
        .get('/auth/me')
        .then((d) => d.data.user)
        .catch((e) => {
          if (e.status === 401) return null;
          throw e;
        }),
  });

  const login = async (email, password) => {
    const d = await api.post('/auth/login', { email, password });
    qc.setQueryData(['me'], d.data.user);
    return d.data.user;
  };

  const register = async (name, email, password) => {
    const d = await api.post('/auth/register', { name, email, password });
    qc.setQueryData(['me'], d.data.user);
    return d.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    qc.setQueryData(['me'], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
