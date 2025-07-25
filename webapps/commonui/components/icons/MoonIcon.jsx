import { memo } from 'react';

/**
 * Optimized Moon icon component for dark theme
 * Memoized to prevent unnecessary re-renders
 */
const MoonIcon = memo(({ className = 'w-4 h-4' }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
));

MoonIcon.displayName = 'MoonIcon';

export default MoonIcon;