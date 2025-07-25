import { memo } from 'react';

/**
 * Optimized System icon component for system theme
 * Memoized to prevent unnecessary re-renders
 */
const SystemIcon = memo(({ className = 'w-4 h-4' }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
));

SystemIcon.displayName = 'SystemIcon';

export default SystemIcon;