/**
 * Theme-Aware Chart Example
 * 
 * This example demonstrates how to create data visualizations that
 * automatically adapt to theme changes using CSS custom properties
 * and the theme system.
 */

import React, { useMemo } from 'react';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';

/**
 * Theme-aware chart colors configuration
 */
const CHART_COLORS = {
    light: {
        primary: '#3b82f6',
        secondary: '#10b981',
        tertiary: '#f59e0b',
        background: '#ffffff',
        grid: '#f3f4f6',
        text: '#374151',
        axis: '#6b7280'
    },
    dark: {
        primary: '#60a5fa',
        secondary: '#34d399',
        tertiary: '#fbbf24',
        background: '#111827',
        grid: '#374151',
        text: '#d1d5db',
        axis: '#9ca3af'
    }
};

/**
 * Sample data for demonstration
 */
const SAMPLE_DATA = [
    { month: 'Jan', revenue: 4000, expenses: 2400, profit: 1600 },
    { month: 'Feb', revenue: 3000, expenses: 1398, profit: 1602 },
    { month: 'Mar', revenue: 2000, expenses: 9800, profit: -7800 },
    { month: 'Apr', revenue: 2780, expenses: 3908, profit: -1128 },
    { month: 'May', revenue: 1890, expenses: 4800, profit: -2910 },
    { month: 'Jun', revenue: 2390, expenses: 3800, profit: -1410 },
];

/**
 * Simple SVG Bar Chart with theme awareness
 */
export function ThemeAwareBarChart({ data = SAMPLE_DATA, width = 600, height = 300 }) {
    const { resolvedTheme } = useTheme();
    const colors = CHART_COLORS[resolvedTheme];

    const chartConfig = useMemo(() => {
        const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)));
        const minValue = Math.min(...data.map(d => d.profit));
        const range = maxValue - minValue;

        return {
            maxValue,
            minValue,
            range,
            barWidth: (width - 100) / data.length - 10,
            chartHeight: height - 60
        };
    }, [data, width, height]);

    const getBarHeight = (value) => {
        return Math.abs(value) / chartConfig.range * chartConfig.chartHeight;
    };

    const getBarY = (value) => {
        if (value >= 0) {
            return 30 + (chartConfig.maxValue - value) / chartConfig.range * chartConfig.chartHeight;
        } else {
            return 30 + chartConfig.maxValue / chartConfig.range * chartConfig.chartHeight;
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Monthly Financial Overview
            </h3>

            <svg width={width} height={height} className="overflow-visible">
                {/* Background */}
                <rect width={width} height={height} fill={colors.background} />

                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const y = 30 + ratio * chartConfig.chartHeight;
                    return (
                        <line
                            key={index}
                            x1={50}
                            y1={y}
                            x2={width - 20}
                            y2={y}
                            stroke={colors.grid}
                            strokeWidth={1}
                            strokeDasharray="2,2"
                        />
                    );
                })}

                {/* Zero line */}
                <line
                    x1={50}
                    y1={30 + chartConfig.maxValue / chartConfig.range * chartConfig.chartHeight}
                    x2={width - 20}
                    y2={30 + chartConfig.maxValue / chartConfig.range * chartConfig.chartHeight}
                    stroke={colors.axis}
                    strokeWidth={2}
                />

                {/* Bars */}
                {data.map((item, index) => {
                    const x = 60 + index * (chartConfig.barWidth + 10);

                    return (
                        <g key={item.month}>
                            {/* Revenue bar */}
                            <rect
                                x={x}
                                y={getBarY(item.revenue)}
                                width={chartConfig.barWidth / 3}
                                height={getBarHeight(item.revenue)}
                                fill={colors.primary}
                                className="transition-colors duration-300"
                            />

                            {/* Expenses bar */}
                            <rect
                                x={x + chartConfig.barWidth / 3 + 2}
                                y={getBarY(item.expenses)}
                                width={chartConfig.barWidth / 3}
                                height={getBarHeight(item.expenses)}
                                fill={colors.secondary}
                                className="transition-colors duration-300"
                            />

                            {/* Profit bar */}
                            <rect
                                x={x + (chartConfig.barWidth / 3) * 2 + 4}
                                y={getBarY(item.profit)}
                                width={chartConfig.barWidth / 3}
                                height={getBarHeight(item.profit)}
                                fill={item.profit >= 0 ? colors.primary : colors.tertiary}
                                className="transition-colors duration-300"
                            />

                            {/* Month label */}
                            <text
                                x={x + chartConfig.barWidth / 2}
                                y={height - 10}
                                textAnchor="middle"
                                fill={colors.text}
                                fontSize="12"
                                className="transition-colors duration-300"
                            >
                                {item.month}
                            </text>
                        </g>
                    );
                })}

                {/* Legend */}
                <g transform={`translate(${width - 150}, 40)`}>
                    <rect x={0} y={0} width={12} height={12} fill={colors.primary} />
                    <text x={16} y={10} fill={colors.text} fontSize="12">Revenue</text>

                    <rect x={0} y={20} width={12} height={12} fill={colors.secondary} />
                    <text x={16} y={30} fill={colors.text} fontSize="12">Expenses</text>

                    <rect x={0} y={40} width={12} height={12} fill={colors.tertiary} />
                    <text x={16} y={50} fill={colors.text} fontSize="12">Loss</text>
                </g>
            </svg>
        </div>
    );
}

/**
 * CSS Custom Properties Chart
 * Uses CSS variables for theme-aware styling
 */
export function CSSVariableChart({ data = SAMPLE_DATA }) {
    const maxValue = Math.max(...data.map(d => d.revenue));

    return (
        <div
            className="p-6 rounded-lg border transition-colors duration-300"
            style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
            }}
        >
            <h3 className="text-lg font-semibold mb-4">Revenue Trend (CSS Variables)</h3>

            <div className="space-y-3">
                {data.map((item, index) => {
                    const percentage = (item.revenue / maxValue) * 100;

                    return (
                        <div key={item.month} className="flex items-center space-x-4">
                            <div className="w-8 text-sm font-medium">{item.month}</div>

                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: 'var(--color-primary)',
                                    }}
                                />

                                <div
                                    className="absolute inset-0 flex items-center justify-center text-xs font-medium"
                                    style={{ color: percentage > 50 ? 'white' : 'var(--color-text)' }}
                                >
                                    ${item.revenue.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Recharts integration example (if using recharts library)
 */
export function RechartsThemeExample({ data = SAMPLE_DATA }) {
    const { resolvedTheme } = useTheme();
    const colors = CHART_COLORS[resolvedTheme];

    // This would work with actual recharts components
    const chartProps = useMemo(() => ({
        margin: { top: 20, right: 30, left: 20, bottom: 5 },
        style: {
            backgroundColor: colors.background,
        }
    }), [colors]);

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Recharts Integration Example
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This shows how you would configure recharts with theme-aware colors:
            </div>

            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-x-auto">
                <code>{`
// Recharts configuration with theme colors
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data} {...chartProps}>
    <CartesianGrid strokeDasharray="3 3" stroke="${colors.grid}" />
    <XAxis dataKey="month" stroke="${colors.axis}" />
    <YAxis stroke="${colors.axis}" />
    <Tooltip 
      contentStyle={{
        backgroundColor: '${colors.background}',
        border: '1px solid ${colors.grid}',
        color: '${colors.text}'
      }}
    />
    <Bar dataKey="revenue" fill="${colors.primary}" />
    <Bar dataKey="expenses" fill="${colors.secondary}" />
  </BarChart>
</ResponsiveContainer>
        `}</code>
            </pre>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> Always use the colors object from your theme configuration
                    to ensure consistency across all chart components.
                </p>
            </div>
        </div>
    );
}

/**
 * Complete example with multiple chart types
 */
export default function ThemeAwareChartsExample() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="container mx-auto px-4 py-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Theme-Aware Charts
                    </h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Toggle theme to see charts adapt
                        </span>
                        {/* ThemeToggle would be imported and used here */}
                    </div>
                </header>

                <div className="space-y-8">
                    <ThemeAwareBarChart />
                    <CSSVariableChart />
                    <RechartsThemeExample />
                </div>

                <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        Implementation Notes
                    </h2>

                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Key Principles:
                            </h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Use memoized color configurations to prevent unnecessary recalculations</li>
                                <li>Apply smooth transitions when theme changes occur</li>
                                <li>Ensure sufficient contrast in both light and dark modes</li>
                                <li>Test charts with real data to verify readability</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Performance Tips:
                            </h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Memoize expensive chart calculations based on theme changes</li>
                                <li>Use CSS custom properties for instant color updates</li>
                                <li>Debounce theme changes if charts are computationally expensive</li>
                                <li>Consider lazy loading large chart libraries</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * CSS Custom Properties for Charts
 * Add these to your globals.css file:
 * 
 * :root {
 *   --color-chart-primary: #3b82f6;
 *   --color-chart-secondary: #10b981;
 *   --color-chart-tertiary: #f59e0b;
 *   --color-chart-background: #ffffff;
 *   --color-chart-grid: #f3f4f6;
 *   --color-chart-text: #374151;
 *   --color-chart-axis: #6b7280;
 * }
 * 
 * .dark {
 *   --color-chart-primary: #60a5fa;
 *   --color-chart-secondary: #34d399;
 *   --color-chart-tertiary: #fbbf24;
 *   --color-chart-background: #111827;
 *   --color-chart-grid: #374151;
 *   --color-chart-text: #d1d5db;
 *   --color-chart-axis: #9ca3af;
 * }
 */