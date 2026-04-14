# Floating Navbar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a minimalist "Cyber-Zen" floating navbar with a split desktop/mobile layout.

**Architecture:** A new `FloatingNavbar` UI component will handle desktop navigation with framer-motion layout animations. `Layout.tsx` will be refactored to consume it while maintaining mobile navigation at the bottom.

**Tech Stack:** React, framer-motion, Tailwind CSS, shadcn/ui, lucide-react

---

### Task 1: Implement `FloatingNavbar` Component

**Files:**
- Create: `src/components/ui/floating-navbar.tsx`

**Step 1: Create the baseline component file**

```tsx
import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Home, Share2, BarChart3, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavItem {
  icon: React.ElementType;
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, href: '/', label: 'Сегодня' },
  { icon: Share2, href: '/graph', label: 'Сеть' },
  { icon: BarChart3, href: '/analytics', label: 'Аналитика' },
];

export function FloatingNavbar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-5xl px-4 flex items-center justify-between gap-4">
        
        {/* Left Island: Logo */}
        <Link
          to="/"
          className="flex items-center justify-center h-12 px-4 bg-background/40 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-white/5 transition-colors shadow-sm shrink-0"
        >
          <span className="font-bold text-xl tracking-widest text-foreground">NODES</span>
        </Link>

        {/* Center Island: Primary Navigation */}
        <nav className="hidden md:flex items-center p-1 bg-background/40 backdrop-blur-xl border border-white/5 rounded-full shadow-sm text-foreground gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || (item.href === '/' && location.pathname === '/nodes');

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'relative group flex items-center justify-center px-4 h-10 rounded-full transition-colors duration-300',
                  isActive
                    ? 'text-primary-foreground font-medium hover:-translate-y-0.5 transition-all duration-500'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <item.icon className="relative z-10 w-4 h-4 mr-2" />
                <span className="relative z-10 text-sm font-semibold tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Island: Theme & Profile */}
        <div className="flex items-center justify-center bg-background/40 backdrop-blur-xl border border-white/5 rounded-full p-1 shadow-sm h-12 px-2 gap-2 shrink-0">
          <ThemeToggle />
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            title="Профиль"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/floating-navbar.tsx
git commit -m "feat: implement minimal FloatingNavbar component"
```

---

### Task 2: Refactor Layout Content

**Files:**
- Modify: `src/widgets/Layout.tsx`

**Step 1: Write refactoring modifications**

Apply the `FloatingNavbar` to `Layout.tsx` while keeping Mobile Bottom Navigation.

```tsx
import { Link, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Share2, BarChart3, User } from "lucide-react";
import { FloatingNavbar } from "@/components/ui/floating-navbar";

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Сегодня", icon: Home },
    { path: "/graph", label: "Сеть", icon: Share2 },
    { path: "/analytics", label: "Аналитика", icon: BarChart3 },
    { path: "/profile", label: "Профиль", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0 transition-colors duration-300">
      
      {/* Desktop & Mobile Top Navbar */}
      <FloatingNavbar />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-xl border-t border-white/5 md:hidden px-4 safe-area-bottom">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/nodes');
            return (
              <Link
                key={item.path}
                to={item.path}
                className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/30 group transition-colors"
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/20 text-primary scale-110" : "text-muted-foreground group-hover:text-primary"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-bold tracking-tight transition-colors",
                  isActive ? "text-primary opacity-100" : "text-muted-foreground opacity-70 group-hover:text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 pt-24 pb-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t py-6 mt-auto transition-colors duration-300 border-white/5">
        <div className="container mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground font-medium tracking-widest uppercase">
          NODES — Формирование связей
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/widgets/Layout.tsx
git commit -m "feat: refactor Layout to consume FloatingNavbar"
```
