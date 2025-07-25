import { useTheme } from '@microrealestate/commonui/hooks/useTheme';
import { Card, CardContent, CardHeader } from '../ui/card';

/**
 * Test component to verify chart color variables are working correctly
 */
export default function ChartColorTest() {
  const { resolvedTheme } = useTheme();

  return (
    <Card className="p-4">
      <CardHeader>
        <h3 className="text-lg font-semibold">Chart Color Variables Test</h3>
        <p className="text-muted-foreground">Current theme: {resolvedTheme}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="space-y-2">
              <div 
                className={`h-16 rounded border-2`}
                style={{
                  backgroundColor: `hsl(var(--chart-${num}))`,
                  borderColor: `hsl(var(--chart-${num}-border))`
                }}
              />
              <div className="text-center">
                <p className="text-sm font-medium">Chart {num}</p>
                <p className="text-xs text-muted-foreground">
                  hsl(var(--chart-{num}))
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 space-y-2">
          <h4 className="font-medium">CSS Custom Properties Test</h4>
          <div className="text-sm space-y-1">
            <p>Chart 1: <span className="font-mono text-[hsl(var(--chart-1))]">hsl(var(--chart-1))</span></p>
            <p>Chart 2: <span className="font-mono text-[hsl(var(--chart-2))]">hsl(var(--chart-2))</span></p>
            <p>Success: <span className="font-mono text-success">hsl(var(--success))</span></p>
            <p>Warning: <span className="font-mono text-warning">hsl(var(--warning))</span></p>
            <p>Destructive: <span className="font-mono text-destructive">hsl(var(--destructive))</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}