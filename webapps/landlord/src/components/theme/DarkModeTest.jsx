import { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@material-ui/core';
import { Card, CardContent, CardHeader } from '../ui/card';
import { useTheme } from '@microrealestate/commonui/hooks/useTheme';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '../ui/chart';
import {
  Bar,
  BarChart,
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';

const testData = [
  { name: 'Jan', value: 400, paid: 300, notPaid: 100 },
  { name: 'Feb', value: 300, paid: 250, notPaid: 50 },
  { name: 'Mar', value: 600, paid: 500, notPaid: 100 },
  { name: 'Apr', value: 800, paid: 700, notPaid: 100 }
];

const radialData = [{ paid: 1200, notPaid: 300 }];

const tableData = [
  {
    id: 1,
    tenant: 'John Doe',
    property: 'Apt 101',
    rent: 1200,
    status: 'Paid',
    balance: 0
  },
  {
    id: 2,
    tenant: 'Jane Smith',
    property: 'Apt 102',
    rent: 1100,
    status: 'Overdue',
    balance: -150
  },
  {
    id: 3,
    tenant: 'Bob Johnson',
    property: 'Apt 103',
    rent: 1300,
    status: 'Paid',
    balance: 0
  },
  {
    id: 4,
    tenant: 'Alice Brown',
    property: 'Apt 104',
    rent: 1000,
    status: 'Partial',
    balance: -500
  },
  {
    id: 5,
    tenant: 'Charlie Wilson',
    property: 'Apt 105',
    rent: 1250,
    status: 'Paid',
    balance: 0
  }
];

export default function DarkModeTest() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    setLoading(true);
    setTimeout(() => {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Dark Mode Test Components</h2>
          <p className="text-muted-foreground">
            Current theme: {resolvedTheme} | Selected: {theme}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Material-UI Components */}
          <div className="space-y-2">
            <h3 className="font-medium">Material-UI Components</h3>
            <div className="flex gap-2">
              <Button variant="contained" color="primary">
                Primary Button
              </Button>
              <Button variant="outlined" color="primary">
                Outlined Button
              </Button>
              <Tooltip title="This is a tooltip">
                <Button variant="text">
                  {loading ? <CircularProgress size={20} /> : 'Hover me'}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Bar Chart Component */}
          <div className="space-y-2">
            <h3 className="font-medium">Bar Chart Component</h3>
            <ChartContainer
              config={{
                paid: {
                  label: 'Paid',
                  color: 'hsl(var(--chart-2))'
                },
                notPaid: {
                  label: 'Not Paid',
                  color: 'hsl(var(--chart-1))'
                }
              }}
              className="h-[250px] w-full"
            >
              <BarChart data={testData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="paid" fill="var(--color-paid)" />
                <Bar dataKey="notPaid" fill="var(--color-notPaid)" />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Radial Chart Component */}
          <div className="space-y-2">
            <h3 className="font-medium">Radial Chart Component</h3>
            <ChartContainer
              config={{
                paid: {
                  label: 'Paid',
                  color: 'hsl(var(--chart-2))'
                },
                notPaid: {
                  label: 'Not Paid',
                  color: 'hsl(var(--chart-1))'
                }
              }}
              className="h-[220px] w-full"
            >
              <RadialBarChart
                data={radialData}
                endAngle={180}
                innerRadius="100%"
                outerRadius="150%"
                cy={'80%'}
              >
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend
                  verticalAlign="top"
                  content={() => (
                    <div className="flex justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-warning">
                        <div className="size-2 bg-[hsl(var(--chart-1))]" />
                        <span>Not Paid</span>
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <div className="size-2 bg-[hsl(var(--chart-2))]" />
                        <span>Paid</span>
                      </div>
                    </div>
                  )}
                />
                <RadialBar
                  dataKey="paid"
                  stackId="rents"
                  cornerRadius={4}
                  fill="var(--color-paid)"
                  stroke="hsl(var(--chart-2-border))"
                />
                <RadialBar
                  dataKey="notPaid"
                  stackId="rents"
                  cornerRadius={4}
                  fill="var(--color-notPaid)"
                  stroke="hsl(var(--chart-1-border))"
                />
              </RadialBarChart>
            </ChartContainer>
          </div>

          {/* Data Table Component */}
          <div className="space-y-2">
            <h3 className="font-medium">Data Table with Row Striping</h3>
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
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'Paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : row.status === 'Overdue'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        row.balance < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {row.balance < 0 ? `-$${Math.abs(row.balance)}` : '$0'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Theme Toggle */}
          <div className="pt-4 border-t">
            <Button
              variant="contained"
              color="primary"
              onClick={handleToggle}
              disabled={loading}
            >
              {loading
                ? 'Switching...'
                : `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
