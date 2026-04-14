# Design: Floating Minimalist Navbar (Cyber-Zen)

## Overview
A redesign of the main application header for the "Nodes" project. The goal is to create a premium, futuristic "Cyber-Zen" aesthetic using floating islands, glassmorphism, and smooth layout animations, adapted from the `navbar-flow.tsx` concept.

## Architecture
1. **Desktop Layout**: A unified, three-section floating header ("islands" conceptually merged or slightly separated).
   - **Left**: Standard text-based "NODES" Logo.
   - **Center**: Primary Navigation (Today, Graph, Analytics) with `motion` powered sliding active-state background.
   - **Right**: Existing `ThemeToggle` and User Profile avatar/icon.
2. **Mobile Layout**: A split, hybrid approach for better UX.
   - **Top**: Floating minimalistic header containing just the Logo, Theme Toggle, and Profile.
   - **Bottom**: Floating tab bar for the primary navigation routes, restyled to match the translucent Cyber-Zen design.

## Components
- **`src/components/ui/floating-navbar.tsx`**: A new, pure UI component that provides the structural styling and `motion` animations for the navigation items.
- **`src/widgets/Layout.tsx`**: Will be refactored to consume the new `floating-navbar` component on desktop, while organizing the mobile split-layout using existing Tailwind responsive prefixes (`hidden md:flex`, etc.).

## Aesthetic & Styling
- **Backgrounds**: Deep glassmorphism (`bg-background/40` + `backdrop-blur-xl`).
- **Borders**: Ultra-thin, subtle borders (`border-white/5` or `border-border/40`).
- **Active States**: Highlighting the active route with an animated shadow/glow and primary color contrast.
- **Dependencies**: Uses `framer-motion` (installed as `motion`) for the smooth `layoutId` pill-sliding effect.

## Status
Design approved. Transitioning to implementation planning.
