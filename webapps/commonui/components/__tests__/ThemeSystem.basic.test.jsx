/**
 * Basic theme system test to verify setup
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent = () => {
    return <div data-testid="test">Theme system test</div>;
};

describe('Theme System Basic Test', () => {
    it('should render test component', () => {
        render(<TestComponent />);
        expect(screen.getByTestId('test')).toBeInTheDocument();
    });

    it('should have working test environment', () => {
        expect(typeof window).toBe('object');
        expect(typeof document).toBe('object');
        expect(typeof localStorage).toBe('object');
    });

    it('should have mocked localStorage', () => {
        localStorage.setItem('test', 'value');
        expect(localStorage.getItem).toHaveBeenCalledWith('test');
    });
});