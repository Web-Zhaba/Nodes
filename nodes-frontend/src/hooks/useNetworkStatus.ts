import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    Network.getStatus().then(status => setIsOnline(status.connected));

    Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    }).then(listener => {
      removeListener = () => listener.remove();
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  return isOnline;
}
