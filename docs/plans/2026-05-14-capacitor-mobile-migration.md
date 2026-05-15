# Capacitor Mobile App Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Transform the React + Vite web app into a cross-platform mobile application using Capacitor, supporting iOS and Android builds while preserving all existing functionality.

**Architecture:** Capacitor wraps the existing Vite production build in a native WebView. We add Capacitor core, essential plugins, native platform configuration, and adapt the web app for mobile (deep linking, status bar, safe areas, keyboard handling). The app continues to talk to Supabase and Django API exactly as before.

**Tech Stack:** Capacitor 7, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/keyboard`, `@capacitor/preferences`, `@capacitor/app`, `@capacitor/network`, Vite PWA plugin (optional but useful for offline assets).

---

## Prerequisites
- Node.js 18+ and npm installed
- Android Studio installed (for Android builds)
- Xcode installed (for iOS builds, macOS only)
- `JAVA_HOME` and `ANDROID_HOME` environment variables set (for Android)

---

## Task 1: Install Capacitor Dependencies

**Files:**
- Modify: `nodes-frontend/package.json`
- Run in: `nodes-frontend/`

**Step 1: Install Capacitor core packages and plugins**

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/preferences @capacitor/app @capacitor/network
```

**Step 2: Verify `package.json` contains new deps**

Run: `cat package.json | grep capacitor`
Expected: All `@capacitor/*` packages listed in `dependencies`.

---

## Task 2: Initialize Capacitor Configuration

**Files:**
- Create: `nodes-frontend/capacitor.config.ts`
- Modify: `nodes-frontend/vite.config.ts` (update `base` for static hosting)

**Step 1: Create `capacitor.config.ts`**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nodes.app',
  appName: 'Nodes',
  webDir: 'dist',
  server: {
    // In dev, allow cleartext to local Django if needed; production uses HTTPS Supabase
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#030303',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030303',
    },
  },
};

export default config;
```

**Step 2: Update `vite.config.ts` base path**

Capacitor serves from `file://` on device; Vite build must use relative paths.

```typescript
export default defineConfig({
  base: './', // ADD THIS LINE
  plugins: [
    // existing plugins...
  ],
  // rest unchanged...
});
```

Run: `npx tsc --noEmit` in `nodes-frontend/`
Expected: No type errors.

---

## Task 3: Update `index.html` for Mobile

**Files:**
- Modify: `nodes-frontend/index.html`

**Step 1: Add mobile meta tags and CSP**

Replace the `<head>` block (preserve existing font preloads and FOUC script) with:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="msapplication-tap-highlight" content="no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta http-equiv="Content-Security-Policy" content="default-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * 'self'; img-src * 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <!-- Keep existing font preloads exactly as before -->
  <link rel="preload" href="/fonts/PlusJakartaSans-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/PlusJakartaSans-Medium.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/PlusJakartaSans-Bold.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/PlusJakartaSans-SemiBold.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/IBMPlexMono-Regular.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/IBMPlexMono-Medium.woff2" as="font" type="font/woff2" crossorigin />
  <title>Nodes — Новый взгляд на формирование привычек</title>
  <script>
    // Keep existing FOUC inline script exactly as before
    (function() {
      try {
        const storage = localStorage.getItem('nodes-theme-storage');
        let mode = 'dark';
        let colors = null;
        if (storage) {
          const parsed = JSON.parse(storage);
          mode = parsed.state?.config?.mode || 'dark';
          colors = parsed.state?.config?.colors?.[mode];
        }
        const root = document.documentElement;
        if (mode === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        const bgColor = colors?.['--background'] || (mode === 'dark' ? '#030303' : '#ffffff');
        const fgColor = colors?.['--foreground'] || (mode === 'dark' ? '#ffffff' : '#000000');
        document.write('<style id="fouc-fix">html { background-color: ' + bgColor + ' !important; color: ' + fgColor + ' !important; }</style>');
        if (colors) {
          Object.entries(colors).forEach(([token, value]) => {
            root.style.setProperty(token, value);
          });
        }
      } catch (e) {}
    })();
  </script>
</head>
```

**Step 2: Add Capacitor platform script before closing `</body>`**

```html
  <script type="module" src="/src/main.tsx"></script>
  <script>
    // Capacitor runtime detection
    window.isCapacitor = typeof Capacitor !== 'undefined';
  </script>
</body>
```

---

## Task 4: Switch Router to HashRouter for Mobile Compatibility

**Files:**
- Modify: `nodes-frontend/src/App.tsx`

Capacitor apps use `file://` protocol; `BrowserRouter` history API breaks. Switch to `HashRouter` when running in Capacitor, keep `BrowserRouter` for web.

**Step 1: Import `HashRouter` and detect Capacitor**

```typescript
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
```

**Step 2: Create router wrapper**

Add before `AuthRedirect`:

```typescript
const Router = (window as any).isCapacitor ? HashRouter : BrowserRouter;
```

Or better, detect at runtime after Capacitor loads. Simpler reliable approach: always use `HashRouter` since it works for both web and mobile, or detect via user agent. For minimal change, replace `<BrowserRouter>` with `<HashRouter>`.

However, to preserve web URLs, let's use a hybrid:

```typescript
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';
const Router = isCapacitor ? HashRouter : BrowserRouter;
```

**Step 3: Replace `<BrowserRouter>` with `<Router>`**

```tsx
<Router>
  <Suspense ...>
    <Routes>...</Routes>
  </Suspense>
</Router>
```

Run: `npm run build` in `nodes-frontend/`
Expected: Build succeeds with no errors.

---

## Task 5: Add Capacitor Mobile Initialization

**Files:**
- Modify: `nodes-frontend/src/main.tsx`
- Create: `nodes-frontend/src/lib/capacitor.ts`

**Step 1: Create `src/lib/capacitor.ts`**

```typescript
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';

export async function initializeMobileApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Set status bar style based on theme
    const isDark = document.documentElement.classList.contains('dark');
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? '#030303' : '#ffffff' });
  } catch (e) {
    console.warn('StatusBar init failed', e);
  }

  try {
    await Keyboard.setResizeMode({ mode: 'native' });
  } catch (e) {
    console.warn('Keyboard init failed', e);
  }

  // Handle app state changes
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      await SplashScreen.hide();
    }
  });

  // Handle network status
  Network.addListener('networkStatusChange', (status) => {
    console.log('Network status changed', status.connected);
  });

  // Hide splash after init
  setTimeout(() => {
    SplashScreen.hide();
  }, 1500);
}

export const isNative = () => Capacitor.isNativePlatform();
```

**Step 2: Update `main.tsx` to initialize Capacitor**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import { initializeMobileApp } from './lib/capacitor'
import App from './App.tsx'

// Initialize Capacitor native layer before rendering
initializeMobileApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
```

Run: `npm run build` in `nodes-frontend/`
Expected: Build succeeds.

---

## Task 6: Add Native Project Platforms

**Files:**
- Run in: `nodes-frontend/`
- Creates: `android/`, `ios/`, `capacitor.config.ts` (already created)

**Step 1: Add Android platform**

```bash
npx cap add android
```

Expected: `android/` directory created with Gradle project.

**Step 2: Add iOS platform**

```bash
npx cap add ios
```

Expected: `ios/` directory created with Xcode project.

**Step 3: Update Android `cleartextTrafficPermitted`**

For local Django development on Android, edit `android/app/src/main/res/xml/network_security_config.xml` or add to `AndroidManifest.xml`:

```xml
<application android:usesCleartextTraffic="true" ...>
```

And create `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
```

Reference it in `AndroidManifest.xml`:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ... >
```

**Step 4: Update iOS `Info.plist` for HTTP loads**

Edit `ios/App/App/Info.plist`, add:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

---

## Task 7: Add Splash Screen and Icons Resources

**Files:**
- Create: `nodes-frontend/resources/` directory with icon and splash PNGs
- Modify: `nodes-frontend/capacitor.config.ts` (point to resources)
- Run: `npx cap copy` after resources placed

**Step 1: Generate resources**

Provide a `resources/icon.png` (1024x1024) and `resources/splash.png` (2732x2732) in `nodes-frontend/resources/`.

If no designer assets yet, create simple placeholder images or use `@capacitor/assets`:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#030303' --splashBackgroundColor '#030303'
```

This auto-generates all iOS/Android icon and splash sizes into `resources/` and copies them to native projects.

**Step 2: Add resource config to `capacitor.config.ts`**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nodes.app',
  appName: 'Nodes',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#030303',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030303',
      overlaysWebView: false,
    },
  },
};

export default config;
```

---

## Task 8: Add Safe Area and Mobile CSS Adjustments

**Files:**
- Modify: `nodes-frontend/src/index.css` (add safe area insets)
- Create: `nodes-frontend/src/styles/mobile.css` (mobile-specific overrides)

**Step 1: Add safe area variables to `index.css`**

```css
/* Mobile safe areas */
:root {
  --sat: env(safe-area-inset-top);
  --sar: env(safe-area-inset-right);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
}

/* Prevent rubber-band scrolling on iOS */
html, body {
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: touch;
}

/* Status bar padding for iOS notch */
@supports (padding-top: env(safe-area-inset-top)) {
  .mobile-safe-top {
    padding-top: env(safe-area-inset-top);
  }
  .mobile-safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

**Step 2: Import mobile styles in `main.tsx`**

```typescript
import './index.css'
import './styles/mobile.css' // ADD THIS
import './lib/i18n'
```

---

## Task 9: Handle Deep Linking (App Links / Universal Links)

**Files:**
- Modify: `nodes-frontend/capacitor.config.ts`
- Modify: `nodes-frontend/src/App.tsx`
- Create: `nodes-frontend/src/hooks/useDeepLinks.ts`

**Step 1: Install deep link plugin**

```bash
npm install @capacitor/app
```

(already installed in Task 1)

**Step 2: Create `src/hooks/useDeepLinks.ts`**

```typescript
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';

export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = App.addListener('appUrlOpen', (event: { url: string }) => {
      // Expected URLs: nodes://share/u/:slug or nodes://share/n/:token
      // Or https://yourdomain.com/share/u/:slug
      const url = new URL(event.url);
      const path = url.pathname || url.hash.replace('#', '');
      
      if (path.startsWith('/share/')) {
        navigate(path);
      } else if (path === '/' || path === '') {
        navigate('/');
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);
}
```

**Step 3: Use hook in `App.tsx` inside router context**

Add near other hooks in `App()`:

```typescript
import { useDeepLinks } from '@/hooks/useDeepLinks';

function App() {
  useDeepLinks(); // ADD THIS
  // existing code...
}
```

**Step 4: Configure custom URL scheme in `capacitor.config.ts`**

```typescript
server: {
  // ... existing server config
},
// Add URL scheme for deep linking
// NOTE: This is configured in native projects (AndroidManifest / Info.plist)
// Capacitor CLI does not set URL scheme automatically; must edit native files.
```

**Step 4b: Android — Edit `android/app/src/main/AndroidManifest.xml`**

Inside `<activity android:name=".MainActivity">` add intent-filter:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="nodes" />
</intent-filter>
```

**Step 4c: iOS — Edit `ios/App/App/Info.plist`**

Add:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.nodes.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>nodes</string>
        </array>
    </dict>
</array>
```

---

## Task 10: Handle Back Button on Android

**Files:**
- Modify: `nodes-frontend/src/hooks/useDeepLinks.ts` (or create new hook)

**Step 1: Extend `useDeepLinks.ts` into `useMobileNavigation.ts`**

```typescript
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
```

**Step 2: Replace `useDeepLinks` with `useMobileNavigation` in `App.tsx`**

```typescript
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

function App() {
  useMobileNavigation();
  // ...
}
```

Delete `useDeepLinks.ts` if no longer needed.

---

## Task 11: Handle Network & Offline State

**Files:**
- Modify: `nodes-frontend/src/App.tsx`
- Create: `nodes-frontend/src/hooks/useNetworkStatus.ts`

**Step 1: Create network status hook**

```typescript
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
```

**Step 2: Show offline banner in `App.tsx`**

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function App() {
  const isOnline = useNetworkStatus();
  // ...

  return (
    <QueryClientProvider client={queryClient}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-xs py-1 px-4 safe-top">
          Нет подключения к интернету
        </div>
      )}
      {/* ... rest of app ... */}
    </QueryClientProvider>
  );
}
```

---

## Task 12: Update `tsconfig.app.json` and Type Declarations

**Files:**
- Modify: `nodes-frontend/tsconfig.app.json`
- Create: `nodes-frontend/src/types/capacitor.d.ts`

**Step 1: Add Capacitor types to `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    // ... existing options ...
    "types": ["vite/client", "@capacitor/core"]
  }
}
```

**Step 2: Create `src/types/capacitor.d.ts`**

```typescript
/// <reference types="@capacitor/core" />

declare global {
  interface Window {
    isCapacitor?: boolean;
    Capacitor?: import('@capacitor/core').CapacitorGlobal;
  }
}

export {};
```

Run: `npm run build`
Expected: Build passes with no TS errors.

---

## Task 13: Add Build Scripts to `package.json`

**Files:**
- Modify: `nodes-frontend/package.json`

**Step 1: Add mobile scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "knip": "knip",
    "mobile:sync": "npx cap sync",
    "mobile:copy": "npx cap copy",
    "mobile:open:android": "npx cap open android",
    "mobile:open:ios": "npx cap open ios",
    "mobile:build": "npm run build && npx cap sync",
    "mobile:resources": "npx capacitor-assets generate --iconBackgroundColor '#030303' --splashBackgroundColor '#030303'"
  }
}
```

---

## Task 14: Final Build and Sync

**Files:**
- Run in: `nodes-frontend/`

**Step 1: Production build**

```bash
npm run build
```

Expected: `dist/` folder created.

**Step 2: Sync to native projects**

```bash
npx cap sync
```

Expected: Android and iOS projects updated with latest web assets.

**Step 3: Open Android Studio / Xcode**

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

**Step 4: Build native apps**

In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
In Xcode: Product → Archive (for App Store)

---

## Task 15: Documentation Update

**Files:**
- Create: `docs/capacitor-setup.md`

Write a concise setup guide covering:
- Prerequisites (Android Studio, Xcode, environment variables)
- Initial setup commands (`npm install`, `npx cap add`)
- Build workflow (`npm run mobile:build`)
- Running on device/simulator
- Troubleshooting (CORS, HTTP cleartext, deep links)

---

## Testing Checklist

- [ ] `npm run build` passes without errors
- [ ] `npx cap sync` succeeds
- [ ] Android app launches without white screen
- [ ] iOS app launches without white screen
- [ ] Splash screen shows themed background
- [ ] Status bar matches app theme (dark/light)
- [ ] All routes work (login, nodes list, graph, analytics, profile)
- [ ] Supabase auth works (login/logout/session persistence)
- [ ] Django API calls succeed (stability calculation, impulses)
- [ ] Deep links open correct screens
- [ ] Android back button navigates back or exits app
- [ ] Keyboard does not overlap input fields
- [ ] Safe areas respected on notched devices
- [ ] Offline banner appears when disconnected

---

## Potential Issues & Fixes

1. **White screen after splash**: Check `base: './'` in Vite config, verify `webDir: 'dist'` in capacitor config.
2. **CORS on API calls**: Supabase already allows cross-origin; Django must allow `capacitor://localhost` and `http://localhost` origins.
3. **HTTP blocked on Android/iOS**: Cleartext enabled in both platforms for dev. Production uses HTTPS.
4. **Router 404 on refresh**: HashRouter prevents this in file:// context.
5. **Storage sync**: `localStorage` works in WebView; Capacitor Preferences plugin is more robust for native but not required for initial port.

---

## Summary of Files Changed

| File | Action |
|------|--------|
| `nodes-frontend/package.json` | Add Capacitor deps and scripts |
| `nodes-frontend/capacitor.config.ts` | Create new |
| `nodes-frontend/vite.config.ts` | Add `base: './'` |
| `nodes-frontend/index.html` | Add mobile meta tags |
| `nodes-frontend/src/main.tsx` | Initialize Capacitor before render |
| `nodes-frontend/src/App.tsx` | Switch router, add network banner, mobile nav hook |
| `nodes-frontend/src/lib/capacitor.ts` | Create mobile init module |
| `nodes-frontend/src/hooks/useMobileNavigation.ts` | Handle back button + deep links |
| `nodes-frontend/src/hooks/useNetworkStatus.ts` | Network state hook |
| `nodes-frontend/src/index.css` | Safe area CSS |
| `nodes-frontend/src/styles/mobile.css` | Mobile-specific styles (new) |
| `nodes-frontend/src/types/capacitor.d.ts` | Type declarations |
| `nodes-frontend/tsconfig.app.json` | Add Capacitor types |
| `android/` | Generated by `npx cap add android` + manual network config |
| `ios/` | Generated by `npx cap add ios` + manual ATS config |
| `docs/capacitor-setup.md` | Setup documentation |

**Plan complete.**
