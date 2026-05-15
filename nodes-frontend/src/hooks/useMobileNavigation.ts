import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';

export function useMobileNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const backListener = App.addListener('backButton', () => {
      if (location.pathname === '/' || location.pathname === '/nodes') {
        // Exit app on main screen
        App.exitApp();
      } else {
        navigate(-1);
      }
    });

    const urlListener = App.addListener('appUrlOpen', (event: { url: string }) => {
      const url = new URL(event.url);
      const path = url.pathname || url.hash.replace('#', '');
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
