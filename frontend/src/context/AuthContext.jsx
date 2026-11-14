import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthContext from './auth-context';
import { api, setAccessToken } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    function handleExpiredSession() {
      setUser(null);
      setNotice('Your session expired. Please sign in again.');
    }

    window.addEventListener(
      'shareaplate:session-expired',
      handleExpiredSession,
    );
    return () =>
      window.removeEventListener(
        'shareaplate:session-expired',
        handleExpiredSession,
      );
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await api.post('/auth/login', credentials);
    setAccessToken(result.token);
    setUser(result.user);
    setNotice('');
    return result.user;
  }, []);

  const register = useCallback(
    (details) => api.post('/auth/register', details),
    [],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setNotice('');
  }, []);

  const value = useMemo(
    () => ({
      user,
      notice,
      clearNotice: () => setNotice(''),
      login,
      register,
      logout,
    }),
    [user, notice, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
