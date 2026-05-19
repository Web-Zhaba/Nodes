import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { useNavigate, useLocation } from 'react-router-dom';
import { hapticImpact } from '@/services/haptics.service';
import { supabase } from '@/lib/supabase';

export function useMobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const backListener = App.addListener('backButton', () => {
      hapticImpact('light');
      if (location.pathname === '/' || location.pathname === '/nodes') {
        // Exit app on main screen
        App.exitApp();
      } else {
        navigate(-1);
      }
    });

    const urlListener = App.addListener('appUrlOpen', async (event: { url: string }) => {
      // Handle OAuth callback from in-app browser
      if (event.url.includes('/auth/callback')) {
        try {
          const url = new URL(event.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          try {
            await Browser.close();
          } catch {
            // Browser may already be closed
          }

          if (error) {
            console.error('OAuth error:', errorDescription || error);
            navigate('/login');
            return;
          }

          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('Session exchange error:', exchangeError.message);
              navigate('/login');
              return;
            }
          }

          navigate('/');
        } catch (e) {
          console.error('Failed to handle OAuth callback', e);
          navigate('/login');
        }
        return;
      }

      // General deep-link navigation
      const url = new URL(event.url);
      const path = url.host
        ? `/${url.host}${url.pathname}`
        : (url.pathname || url.hash.replace('#', ''));
      if (path) {
        navigate(path);
      }
    });

    return () => {
      backListener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, [navigate, location]);
}
