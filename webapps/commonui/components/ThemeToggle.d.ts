/* eslint-disable */
import { ReactNode } from 'react';

export interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'button' | 'switch' | 'dropdown';
    showLabel?: boolean;
    showTooltip?: boolean;
    onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
}

export function ThemeToggle(props?: ThemeToggleProps): ReactNode;
export default ThemeToggle;