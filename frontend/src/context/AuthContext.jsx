import { useCallback, useEffect, useMemo, useState } from 'react';
import AuthContext from './auth-context';
import { api, getAccessToken, setAccessToken } from '../services/api';

// Keeps track of who is signed in and shares it with every page
// (React Context). Pages call useAuth() to get user, login, logout…
//
// The signed-in user is saved in sessionStorage next to the login token
// (see services/api.js), so a page refresh keeps you signed in.
const USER_KEY = 'shareaplate:user';

function readStoredUser() {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    return saved && getAccessToken() ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(readStoredUser);

  const setUser = useCallback((nextUser) => {
    setUserState(nextUser);
    try {
      if (nextUser) sessionStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      else sessionStorage.removeItem(USER_KEY);
    } catch {
      // Storage unavailable: the user stays signed in until the page reloads.
    }
  }, []);
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
  }, [setUser]);

  const login = useCallback(
    async (credentials) => {
      const result = await api.post('/auth/login', credentials);
      setAccessToken(result.token);
      setUser(result.user);
      setNotice('');
      return result.user;
    },
    [setUser],
  );

  const register = useCallback(
    async (details) => {
      const result = await api.post('/auth/register', details);
      setAccessToken(result.token);
      setUser(result.user);
      setNotice('');
      return result.user;
    },
    [setUser],
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setNotice('');
  }, [setUser]);

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
