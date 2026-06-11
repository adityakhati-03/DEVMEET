import type { TestCaseType } from '@devmeet/shared';

const TYPE_CONFIG: Record<TestCaseType, { label: string; color: string; bg: string }> = {
  basic:  { label: 'Basic',  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  edge:   { label: 'Edge',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  corner: { label: 'Corner', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  large:  { label: 'Large',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  random: { label: 'Random', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
};

export default function TestCaseTypeBadge({ type }: { type: TestCaseType }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.basic;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.03em',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  );
}
