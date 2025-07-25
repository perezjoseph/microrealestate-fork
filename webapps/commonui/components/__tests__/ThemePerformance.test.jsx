import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemePerformanceMonitor, ThemeBundleAnalyzer, ThemePerformanceTester } from '../utils/themePerformance';
import LazyThemeToggle from '../components/LazyThemeToggle';
import { ThemeToggle } from '../components/ThemeToggle.optimized';

// Mock performance API
const mockPerformance = {
    now: jest.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 // 1MB
    }
};

Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true
});

// Mock useTheme hook
jest.mock('../hooks/useTheme', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        systemTheme: 'light'
    })
}));

describe('Theme Performance Optimizations', () => {
    beforeEach(() => {
        ThemePerformanceMonitor.reset();
        mockPerformance.now.mockClear();
        jest.clearAllMocks();
    });

    describe('ThemePerformanceMonitor', () => {
        it('should measure theme change performance', async () => {
            let startTime = 100;
            let endTime = 150;

            mockPerformance.now
                .mockReturnValueOnce(startTime)
                .mockReturnValueOnce(endTime);

            const measurement = ThemePerformanceMonitor.startThemeChange('light', 'dark');
            const result = measurement.complete();

            expect(result).toEqual({
                duration: 50,
                themeFrom: 'light',
                themeTo: 'dark',
                timestamp: expect.any(Number),
                memoryBefore: 1024 * 1024,
                memoryAfter: 1024 * 1024,
                memoryDelta: 0
            });
        });

        it('should track multiple theme changes', () => {
            mockPerformance.now
                .mockReturnValueOnce(100).mockReturnValueOnce(120)
                .mockReturnValueOnce(200).mockReturnValueOnce(230);

            const measurement1 = ThemePerformanceMonitor.startThemeChange('light', 'dark');
            measurement1.complete();

            const measurement2 = ThemePerformanceMonitor.startThemeChange('dark', 'system');
            measurement2.complete();

            const stats = ThemePerformanceMonitor.getStats();
            expect(stats.themeChanges.count).toBe(2);
            expect(stats.themeChanges.averageDuration).toBe(25);
        });

        it('should warn about slow theme changes', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

            mockPerformance.now
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(250); // 150ms duration (over 100ms threshold)

            const measurement = ThemePerformanceMonitor.startThemeChange('light', 'dark');
            measurement.complete();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Theme switch took 150.00ms')
            );

            consoleSpy.mockRestore();
        });

        it('should measure render performance', () => {
            mockPerformance.now
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(110);

            const mockRenderFn = jest.fn(() => 'rendered');
            const result = ThemePerformanceMonitor.measureRender('ThemeToggle', mockRenderFn);

            expect(result).toBe('rendered');
            expect(mockRenderFn).toHaveBeenCalled();

            const stats = ThemePerformanceMonitor.getStats();
            expect(stats.renderTimes.count).toBe(1);
            expect(stats.renderTimes.averageDuration).toBe(10);
        });

        it('should limit stored measurements to prevent memory leaks', () => {
            mockPerformance.now.mockImplementation(() => Date.now());

            // Add 150 measurements (over the 100 limit)
            for (let i = 0; i < 150; i++) {
                const measurement = ThemePerformanceMonitor.startThemeChange('light', 'dark');
                measurement.complete();
            }

            const stats = ThemePerformanceMonitor.getStats();
            expect(stats.themeChanges.count).toBe(100); // Should be capped at 100
        });
    });

    describe('ThemeBundleAnalyzer', () => {
        it('should analyze bundle size', () => {
            const analysis = ThemeBundleAnalyzer.analyzeBundle();

            expect(analysis).toEqual({
                modules: expect.objectContaining({
                    'ThemeToggle': expect.any(Number),
                    'ThemeProvider': expect.any(Number),
                    'useTheme': expect.any(Number)
                }),
                totalSize: expect.stringMatching(/\d+\.\d+KB/),
                gzippedSize: expect.stringMatching(/\d+\.\d+KB/)
            });
        });

        it('should return null in server environment', () => {
            const originalWindow = global.window;
            delete global.window;

            const analysis = ThemeBundleAnalyzer.analyzeBundle();
            expect(analysis).toBeNull();

            global.window = originalWindow;
        });
    });

    describe('LazyThemeToggle', () => {
        it('should show loading state initially', async () => {
            const { getByLabelText } = render(<LazyThemeToggle />);

            // Should show loading state
            expect(getByLabelText('Loading theme toggle...')).toBeInTheDocument();
        });

        it('should load the actual component after suspense resolves', async () => {
            const { getByRole } = render(<LazyThemeToggle />);

            // Wait for lazy component to load
            await waitFor(() => {
                expect(getByRole('button')).toBeInTheDocument();
            });
        });

        it('should monitor performance when theme changes', async () => {
            const onThemeChange = jest.fn();
            const { getByRole } = render(
                <LazyThemeToggle onThemeChange={onThemeChange} />
            );

            // Wait for component to load
            await waitFor(() => {
                expect(getByRole('button')).toBeInTheDocument();
            });

            const button = getByRole('button');

            mockPerformance.now
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(120);

            await act(async () => {
                fireEvent.click(button);
                // Wait for requestAnimationFrame
                await new Promise(resolve => requestAnimationFrame(resolve));
            });

            expect(onThemeChange).toHaveBeenCalled();

            const stats = ThemePerformanceMonitor.getStats();
            expect(stats.themeChanges.count).toBe(1);
        });
    });

    describe('Optimized ThemeToggle', () => {
        it('should render without performance issues', () => {
            const startTime = performance.now();

            render(<ThemeToggle />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Render should be fast (under 16ms for 60fps)
            expect(renderTime).toBeLessThan(16);
        });

        it('should handle rapid theme changes efficiently', async () => {
            const setTheme = jest.fn();

            // Mock useTheme to return our mock setTheme
            jest.doMock('../hooks/useTheme', () => ({
                useTheme: () => ({
                    theme: 'light',
                    setTheme,
                    resolvedTheme: 'light',
                    systemTheme: 'light'
                })
            }));

            const { getByRole } = render(<ThemeToggle />);
            const button = getByRole('button');

            // Simulate rapid clicks
            for (let i = 0; i < 10; i++) {
                fireEvent.click(button);
            }

            // Should handle all clicks without issues
            expect(setTheme).toHaveBeenCalledTimes(10);
        });
    });

    describe('Performance Thresholds', () => {
        it('should meet theme switching performance requirements', async () => {
            const testResult = await ThemePerformanceTester.runPerformanceTest(5);

            expect(testResult.passedThreshold).toBe(true);
            expect(testResult.averageDuration).toBeLessThan(100); // Under 100ms threshold
            expect(testResult.maxDuration).toBeLessThan(100);
        });

        it('should generate performance report', () => {
            const consoleSpy = jest.spyOn(console, 'group').mockImplementation();
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            const consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

            // Add some test data
            mockPerformance.now
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(120);

            const measurement = ThemePerformanceMonitor.startThemeChange('light', 'dark');
            measurement.complete();

            ThemePerformanceMonitor.logReport();

            expect(consoleSpy).toHaveBeenCalledWith('🎨 Theme Performance Report');
            expect(consoleLogSpy).toHaveBeenCalledWith(
                'Theme Changes:',
                expect.objectContaining({
                    'Total Changes': 1,
                    'Average Duration': '20.00ms'
                })
            );
            expect(consoleGroupEndSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleLogSpy.mockRestore();
            consoleGroupEndSpy.mockRestore();
        });
    });

    describe('Memory Management', () => {
        it('should not leak memory with repeated theme changes', () => {
            const initialMemory = ThemePerformanceMonitor.getMemoryUsage();

            // Simulate many theme changes
            for (let i = 0; i < 100; i++) {
                const measurement = ThemePerformanceMonitor.startThemeChange('light', 'dark');
                measurement.complete();
            }

            const finalMemory = ThemePerformanceMonitor.getMemoryUsage();
            const memoryGrowth = finalMemory - initialMemory;

            // Memory growth should be minimal (less than 1MB)
            expect(memoryGrowth).toBeLessThan(1024 * 1024);
        });

        it('should clean up event listeners properly', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            const { unmount } = render(<ThemeToggle />);
            unmount();

            // Should clean up event listeners
            expect(removeEventListenerSpy).toHaveBeenCalled();

            removeEventListenerSpy.mockRestore();
        });
    });
});