'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricsSparklineProps {
  data: number[];
  name?: string;
  testId?: string;
}

export function MetricsSparkline({ data, name = 'metric', testId }: MetricsSparklineProps) {
  const chartData = data.map((value, index) => ({
    time: index,
    value,
  }));

  return (
    <div
      className="h-12 w-full"
      data-testid={testId}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
