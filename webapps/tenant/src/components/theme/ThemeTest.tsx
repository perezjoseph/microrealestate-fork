'use client';

import { useTheme } from '../providers/ThemeProvider';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';

const tableData = [
  { id: 1, tenant: 'John Doe', property: 'Apt 101', rent: 1200, status: 'Paid', balance: 0 },
  { id: 2, tenant: 'Jane Smith', property: 'Apt 102', rent: 1100, status: 'Overdue', balance: -150 },
  { id: 3, tenant: 'Bob Johnson', property: 'Apt 103', rent: 1300, status: 'Paid', balance: 0 },
  { id: 4, tenant: 'Alice Brown', property: 'Apt 104', rent: 1000, status: 'Partial', balance: -500 },
  { id: 5, tenant: 'Charlie Wilson', property: 'Apt 105', rent: 1250, status: 'Paid', balance: 0 }
];

/**
 * Test component to verify theme integration is working correctly
 * This component can be temporarily added to pages for testing
 */
export function ThemeTest() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading theme...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Dark Mode Test Components (Tenant App)</h2>
          <p className="text-muted-foreground">
            Current theme: {resolvedTheme} | Selected: {theme} | System: {systemTheme}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Controls */}
          <div className="space-y-2">
            <h3 className="font-medium">Theme Controls</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setTheme('light')}
                variant={theme === 'light' ? 'default' : 'outline'}
              >
                Light
              </Button>
              <Button
                onClick={() => setTheme('dark')}
                variant={theme === 'dark' ? 'default' : 'outline'}
              >
                Dark
              </Button>
              <Button
                onClick={() => setTheme('system')}
                variant={theme === 'system' ? 'default' : 'outline'}
              >
                System
              </Button>
            </div>
          </div>

          {/* Data Table Component */}
          <div className="space-y-2">
            <h3 className="font-medium">Data Table with Row Striping and Hover States</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    className={index % 2 === 0 ? 'bg-muted/30' : ''}
                  >
                    <TableCell className="font-medium">{row.tenant}</TableCell>
                    <TableCell>{row.property}</TableCell>
                    <TableCell className="text-right">${row.rent}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.status === 'Paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : row.status === 'Overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      row.balance < 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {row.balance < 0 ? `-$${Math.abs(row.balance)}` : '$0'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Color Palette Test */}
          <div className="space-y-2">
            <h3 className="font-medium">Chart Color Palette Test</h3>
            <div className="grid grid-cols-5 gap-2">
              <div className="space-y-1">
                <div className="h-8 bg-[hsl(var(--chart-1))] rounded border border-[hsl(var(--chart-1-border))]"></div>
                <p className="text-xs text-center">Chart 1</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-[hsl(var(--chart-2))] rounded border border-[hsl(var(--chart-2-border))]"></div>
                <p className="text-xs text-center">Chart 2</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-[hsl(var(--chart-3))] rounded border border-[hsl(var(--chart-3-border))]"></div>
                <p className="text-xs text-center">Chart 3</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-[hsl(var(--chart-4))] rounded border border-[hsl(var(--chart-4-border))]"></div>
                <p className="text-xs text-center">Chart 4</p>
              </div>
              <div className="space-y-1">
                <div className="h-8 bg-[hsl(var(--chart-5))] rounded border border-[hsl(var(--chart-5-border))]"></div>
                <p className="text-xs text-center">Chart 5</p>
              </div>
            </div>
          </div>

          {/* Status Colors Test */}
          <div className="space-y-2">
            <h3 className="font-medium">Status Colors Test</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-success rounded"></div>
                <span className="text-success-foreground">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning rounded"></div>
                <span className="text-warning-foreground">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-destructive rounded"></div>
                <span className="text-destructive-foreground">Destructive</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ThemeTest;