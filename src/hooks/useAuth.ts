import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    
    // Re-fetch user when the page becomes visible again
    // This is helpful for mobile where OAuth might happen in a new tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUser();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchUser]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin - support localhost, 127.0.0.1 and production domains
      const origin = event.origin;
      const isAllowedOrigin = 
        origin.endsWith('.run.app') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1');

      if (!isAllowedOrigin) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        // Small delay to ensure cookies are settled in the browser
        setTimeout(() => {
          fetchUser();
        }, 500);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchUser]);

  const login = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'google_login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // If popup was blocked (common on mobile), fallback to direct redirect
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return { user, isLoading, login, logout };
}
