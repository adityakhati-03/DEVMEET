/**
 * Toolbar — top of the code editor in the room.
 *
 * Key points:
 * - Removed "use client" directive (Vite/React, not Next.js)
 * - Languages from SUPPORTED_LANGUAGES constant (no network fetch needed)
 * - Custom-styled select: dark bg, emerald accent, monospace font
 * - Exported as default export
 */

import { SUPPORTED_LANGUAGES } from '@devmeet/shared';
import './toolbar.css';

/** Map language name → a short colour indicator */
const LANG_COLORS: Record<string, string> = {
  JavaScript: '#f7df1e',
  Python:     '#3b82f6',
  C:          '#6b7280',
  'C++':      '#4f8fde',
  Java:       '#f59e0b',
  Go:         '#00add8',
  Ruby:       '#e0115f',
  PHP:        '#7c3aed',
  Rust:       '#f97316',
};

interface ToolbarProps {
  language: string;
  onLanguageChange: (lang: string) => void;
}

export default function Toolbar({ language, onLanguageChange }: ToolbarProps) {
  const dotColor = LANG_COLORS[language] ?? '#6b7280';

  return (
    <div className="toolbar-root">
      {/* Language selector */}
      <div className="toolbar-lang-wrap">
        {/* coloured dot indicator */}
        <span
          className="toolbar-lang-dot"
          style={{ background: dotColor }}
          aria-hidden="true"
        />

        <select
          className="toolbar-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          aria-label="Select programming language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>

        {/* chevron icon */}
        <svg
          className="toolbar-chevron"
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
