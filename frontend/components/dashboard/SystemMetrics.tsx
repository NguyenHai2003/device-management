import { Progress } from "@/components/ui/progress";
import { MetricsSparkline } from "./MetricsSparkline";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SystemMetricsProps {
  cpuUsage: number;
  cpuBreakdown: { user: number; system: number };
  ramUsage: { total: string; used: string; available: string; free: string };
  ramUsagePercent: number;
  networkUsage: { up: string; down: string; txTotal: string; rxTotal: string };
  loadAverage: number | null;
  loadCurrentLoad: number;
  cpuHistory: number[];
  networkHistory: number[];
  testId?: string;
}

export function SystemMetrics({
  cpuUsage,
  cpuBreakdown,
  ramUsage,
  ramUsagePercent,
  networkUsage,
  loadAverage,
  loadCurrentLoad,
  cpuHistory,
  networkHistory,
  testId,
}: SystemMetricsProps) {
  const cpuBreakdownData = [
    { name: "User", value: Number(cpuBreakdown.user.toFixed(2)) },
    { name: "System", value: Number(cpuBreakdown.system.toFixed(2)) },
  ];

  return (
    <div className="space-y-6" data-testid={testId}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">CPU Usage</p>
            <span className="text-sm font-semibold text-primary">
              {cpuUsage}%
            </span>
          </div>
          <Progress value={cpuUsage} className="h-2" />
          <MetricsSparkline
            data={cpuHistory}
            name="cpu"
            testId="cpu-sparkline"
          />
          <p className="text-xs text-muted-foreground">
            User: {cpuBreakdown.user.toFixed(2)}% | System:{" "}
            {cpuBreakdown.system.toFixed(2)}%
          </p>
          <div className="h-24 w-full" data-testid="cpu-breakdown-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cpuBreakdownData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={24}
                  outerRadius={36}
                  paddingAngle={2}
                >
                  <Cell fill="var(--chart-1)" />
                  <Cell fill="var(--chart-2)" />
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Memory</p>
            <span className="text-sm font-semibold text-primary">
              {ramUsage.used} / {ramUsage.total}
            </span>
          </div>
          <Progress value={ramUsagePercent} className="h-2" />
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <p>Available: {ramUsage.available}</p>
            <p>Free: {ramUsage.free}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Load Average</p>
            <span
              className="text-sm font-semibold text-primary"
              data-testid="load-average"
            >
              {loadAverage !== null ? loadAverage.toFixed(2) : "N/A"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Current Load: {loadCurrentLoad.toFixed(2)}%
            {loadAverage === null && (
              <span className="ml-2 text-muted-foreground/60">
                (Load avg not available on Windows)
              </span>
            )}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Network Usage</p>
            <span className="text-xs font-semibold text-primary">
              ↑ {networkUsage.up} | ↓ {networkUsage.down}
            </span>
          </div>
          <MetricsSparkline
            data={networkHistory}
            name="network"
            testId="network-sparkline"
          />
          <p className="text-xs text-muted-foreground">
            Total RX: {networkUsage.rxTotal} | Total TX: {networkUsage.txTotal}
          </p>
        </div>
      </div>
    </div>
  );
}
