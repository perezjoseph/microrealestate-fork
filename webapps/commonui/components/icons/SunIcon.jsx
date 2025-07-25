import { memo } from 'react';

/**
 * Optimized Sun icon component for light theme
 * Memoized to prevent unnecessary re-renders
 */
const SunIcon = memo(({ className = 'w-4 h-4' }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
));

SunIcon.displayName = 'SunIcon';

export default SunIcon;