import { useMemo, useRef, useState, useEffect } from 'react';

// ── Lucide SVG icon paths (no dependency) ──
const ICON_PATHS: Record<string, string> = {
  Heart:        'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  Briefcase:    'M22 9V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2M2 9h20M2 9v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9',
  Palette:      'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.6-.4-1 0-.8.7-1.5 1.6-1.5h1.9c3.1 0 5.6-2.5 5.6-5.6 0-6.1-4.5-10.2-10-10.2zM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  Users:        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm12 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  Brain:        'M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0-.553 6.536A4 4 0 0 0 5.553 21H12M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1 .553 6.536A4 4 0 0 1 18.447 21H12M12 5v16M12 13a4 4 0 0 0-4 4c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2 4 4 0 0 0-4-4z',
  Dumbbell:     'm6.5 6.5 11 11M21 21l-1-1M3 3l1 1m18 18 4-4M2 6l4-4M3 10l7-7m4 14 7-7',
  Moon:         'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
  BookOpen:     'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  Code:         'M16 18l6-6-6-6M8 6l-6 6 6 6',
  Pencil:       'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5zM15 5l4 4',
  Phone:        'M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18.8a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
  Droplets:     'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S10.5 5 10 2.5c-.5 2.5-2 4.9-4 6.5C4 11.1 3 13 3 15a7 7 0 0 0 7 7z',
  GraduationCap:'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 3 3 6 3s6-1 6-3v-5',
  Music:        'M9 18V5l12-2v13M6 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm12-2a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
  Utensils:     'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
  UserRound:    'M12 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 0V2m0 16v6M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41',
  RotateCcw:    'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
};

// ── Node layout: cores + their children grouped ──
const CX_HEALTH  = 160; const CY_HEALTH  = 140;
const CX_CAREER  = 660; const CY_CAREER  = 140;
const CX_CREATIVE= 660; const CY_CREATIVE= 360;
const CX_SOCIAL  = 160; const CY_SOCIAL  = 360;
const CX_MIND    = 410; const CY_MIND    = 250;

interface NodeDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  r: number;
  opacity: number;
  delay: number;
}

interface LinkDef {
  source: string;
  target: string;
  color: string;
  delay: number;
}

const NODES: NodeDef[] = [
  // cores
  { id: 'core-health',   name: 'Health',    icon: 'Heart',        color: '#22c55e', x: CX_HEALTH,   y: CY_HEALTH,   r: 22, opacity: 0.9, delay: 0.00 },
  { id: 'core-career',   name: 'Career',    icon: 'Briefcase',    color: '#3b82f6', x: CX_CAREER,   y: CY_CAREER,   r: 22, opacity: 0.9, delay: 0.08 },
  { id: 'core-creative', name: 'Creative',  icon: 'Palette',      color: '#f59e0b', x: CX_CREATIVE, y: CY_CREATIVE, r: 22, opacity: 0.9, delay: 0.16 },
  { id: 'core-social',   name: 'Social',    icon: 'Users',        color: '#ec4899', x: CX_SOCIAL,   y: CY_SOCIAL,   r: 22, opacity: 0.9, delay: 0.24 },
  { id: 'core-mind',     name: 'Mind',      icon: 'Brain',        color: '#8b5cf6', x: CX_MIND,     y: CY_MIND,     r: 22, opacity: 0.9, delay: 0.32 },
  // health children
  { id: 'run',       name: 'Morning Run', icon: 'Dumbbell',  color: '#22c55e', x: CX_HEALTH - 90,  y: CY_HEALTH - 70, r: 9, opacity: 0.85, delay: 0.55 },
  { id: 'gym',       name: 'Gym',         icon: 'Dumbbell',  color: '#22c55e', x: CX_HEALTH + 80,  y: CY_HEALTH - 60, r: 9, opacity: 0.70, delay: 0.62 },
  { id: 'sleep',     name: '8h Sleep',    icon: 'Moon',      color: '#22c55e', x: CX_HEALTH - 60,  y: CY_HEALTH + 70, r: 10, opacity: 0.95, delay: 0.69 },
  { id: 'water',     name: '2L Water',    icon: 'Droplets',  color: '#22c55e', x: CX_HEALTH + 70,  y: CY_HEALTH + 60, r: 8, opacity: 0.82, delay: 0.76 },
  { id: 'cook',      name: 'Cooking',     icon: 'Utensils',  color: '#22c55e', x: CX_HEALTH,       y: CY_HEALTH - 95, r: 8, opacity: 0.78, delay: 0.83 },
  // career children
  { id: 'coding',    name: 'Deep Work',    icon: 'Code',         color: '#3b82f6', x: CX_CAREER - 80,  y: CY_CAREER - 65, r: 10, opacity: 0.80, delay: 0.58 },
  { id: 'meetings',  name: 'Team Sync',    icon: 'Users',        color: '#3b82f6', x: CX_CAREER + 70,  y: CY_CAREER - 70, r: 9, opacity: 0.60, delay: 0.65 },
  { id: 'study',     name: 'Study',        icon: 'GraduationCap',color: '#3b82f6', x: CX_CAREER - 65,  y: CY_CAREER + 65, r: 9, opacity: 0.50, delay: 0.72 },
  // creative children
  { id: 'reading',   name: 'Daily Reading',icon: 'BookOpen',     color: '#f59e0b', x: CX_CREATIVE - 85, y: CY_CREATIVE - 60, r: 9, opacity: 0.75, delay: 0.60 },
  { id: 'writing',   name: 'Journaling',   icon: 'Pencil',       color: '#f59e0b', x: CX_CREATIVE + 70, y: CY_CREATIVE - 65, r: 8, opacity: 0.65, delay: 0.67 },
  { id: 'music',     name: 'Music',        icon: 'Music',        color: '#f59e0b', x: CX_CREATIVE,      y: CY_CREATIVE + 80, r: 7, opacity: 0.40, delay: 0.74 },
  // social children
  { id: 'calls',     name: 'Family Calls', icon: 'Phone',        color: '#ec4899', x: CX_SOCIAL - 80,  y: CY_SOCIAL - 60, r: 8, opacity: 0.55, delay: 0.63 },
  { id: 'friends',   name: 'Friends',      icon: 'UserRound',    color: '#ec4899', x: CX_SOCIAL + 75,  y: CY_SOCIAL - 55, r: 8, opacity: 0.62, delay: 0.70 },
  // mind children
  { id: 'meditation',name: 'Meditation',   icon: 'Moon',         color: '#8b5cf6', x: CX_MIND - 80,  y: CY_MIND - 60, r: 10, opacity: 0.88, delay: 0.60 },
  { id: 'review',    name: 'Weekly Review',icon: 'RotateCcw',    color: '#8b5cf6', x: CX_MIND + 80,  y: CY_MIND - 55, r: 8, opacity: 0.70, delay: 0.67 },
];

const LINKS: LinkDef[] = [
  // health
  { source: 'core-health', target: 'run',     color: '#22c55e44', delay: 0.35 },
  { source: 'core-health', target: 'gym',     color: '#22c55e44', delay: 0.38 },
  { source: 'core-health', target: 'sleep',   color: '#22c55e44', delay: 0.41 },
  { source: 'core-health', target: 'water',   color: '#22c55e44', delay: 0.44 },
  { source: 'core-health', target: 'cook',    color: '#22c55e44', delay: 0.47 },
  // career
  { source: 'core-career', target: 'coding',  color: '#3b82f644', delay: 0.38 },
  { source: 'core-career', target: 'meetings',color: '#3b82f644', delay: 0.41 },
  { source: 'core-career', target: 'study',   color: '#3b82f644', delay: 0.44 },
  // creative
  { source: 'core-creative', target: 'reading', color: '#f59e0b44', delay: 0.40 },
  { source: 'core-creative', target: 'writing', color: '#f59e0b44', delay: 0.43 },
  { source: 'core-creative', target: 'music',   color: '#f59e0b44', delay: 0.46 },
  // social
  { source: 'core-social', target: 'calls',   color: '#ec489944', delay: 0.42 },
  { source: 'core-social', target: 'friends', color: '#ec489944', delay: 0.45 },
  // mind
  { source: 'core-mind',   target: 'meditation', color: '#8b5cf644', delay: 0.40 },
  { source: 'core-mind',   target: 'review',    color: '#8b5cf644', delay: 0.43 },
  // inter-core
  { source: 'core-health', target: 'core-mind',     color: '#64748b33', delay: 0.50 },
  { source: 'core-career', target: 'core-creative', color: '#64748b33', delay: 0.52 },
  { source: 'core-social', target: 'core-mind',     color: '#64748b33', delay: 0.54 },
  // inter-node
  { source: 'run',       target: 'gym',       color: '#22c55e33', delay: 0.85 },
  { source: 'coding',    target: 'study',     color: '#3b82f633', delay: 0.88 },
  { source: 'reading',   target: 'writing',   color: '#f59e0b33', delay: 0.90 },
  { source: 'sleep',     target: 'meditation',color: '#64748b33', delay: 0.92 },
];

const VIEW_W = 820;
const VIEW_H = 500;

interface Props {
  lang?: 'en' | 'ru';
}

export default function HeroGraph({ lang = 'en' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeDef>();
    NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const links = useMemo(() => {
    return LINKS.map((l) => {
      const s = nodeMap.get(l.source)!;
      const t = nodeMap.get(l.target)!;
      const len = Math.hypot(t.x - s.x, t.y - s.y);
      return { ...l, x1: s.x, y1: s.y, x2: t.x, y2: t.y, len };
    });
  }, [nodeMap]);

  const iconSize = (r: number) => Math.max(8, r * 0.7);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* background */}
      <rect width={VIEW_W} height={VIEW_H} fill="#0b1120" rx="12" />

      {/* links */}
      {links.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeDasharray={l.len}
          strokeDashoffset={visible ? 0 : l.len}
          opacity={visible ? 1 : 0}
          style={{
            transition: `stroke-dashoffset 0.8s ease ${l.delay}s, opacity 0.4s ease ${l.delay}s`,
          }}
        />
      ))}

      {/* nodes */}
      {NODES.map((n) => {
        const isCore = n.r > 12;
        const isize = iconSize(n.r);
        const path = ICON_PATHS[n.icon];
        return (
          <g
            key={n.id}
            transform={`translate(${n.x}, ${n.y})`}
            opacity={visible ? 1 : 0}
            style={{
              transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${n.delay}s`,
            }}
          >
            {/* circle */}
            <circle
              r={n.r}
              fill={`${n.color}${Math.floor(n.opacity * (isCore ? 0.35 : 0.25) * 255)
                .toString(16)
                .padStart(2, '0')}`}
              stroke={n.color}
              strokeWidth={isCore ? 2.2 : 1.2}
              opacity={n.opacity}
              filter="url(#glow)"
            />
            {/* icon */}
            {path && (
              <g transform={`translate(${-isize / 2}, ${-isize / 2})`}>
                <svg
                  width={isize}
                  height={isize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={n.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                >
                  <path d={path} />
                </svg>
              </g>
            )}
            {/* label */}
            <text
              y={n.r + (isCore ? 18 : 14)}
              textAnchor="middle"
              fill={isCore ? n.color : '#94a3b8'}
              fontSize={isCore ? 12 : 10}
              fontWeight={isCore ? 700 : 400}
              fontFamily="Plus Jakarta Sans, sans-serif"
              opacity={isCore ? 0.95 : 0.65 + n.opacity * 0.35}
              style={{ pointerEvents: 'none' }}
            >
              {n.name}
            </text>
            {isCore && (
              <text
                y={n.r + 32}
                textAnchor="middle"
                fill={n.color}
                fontSize={10}
                fontFamily="IBM Plex Mono, monospace"
                opacity={0.5}
              >
                {n.id === 'core-health' ? '85%' : n.id === 'core-career' ? '72%' : n.id === 'core-creative' ? '60%' : n.id === 'core-social' ? '78%' : '90%'}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
