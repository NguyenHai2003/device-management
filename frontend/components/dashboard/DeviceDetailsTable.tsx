import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemMetrics } from "./SystemMetrics";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeviceDetailsTableProps {
  os: string;
  cpuUsage: number;
  cpuBreakdown: { user: number; system: number };
  ramUsage: { total: string; used: string; available: string; free: string };
  ramUsagePercent: number;
  networkUsage: { up: string; down: string; txTotal: string; rxTotal: string };
  loadAverage: number | null;
  loadCurrentLoad: number;
  monitors: number;
  macAddress: string;
  systemUptime: string;
  hostname: string;
  platform: string;
  architecture: string;
  networkInterfaces: Array<{
    iface: string;
    mac: string;
    ip4: string;
    ip6: string;
    operstate: string;
  }>;
  diskDetails: Array<{
    fs: string;
    type: string;
    mount: string;
    size: string;
    used: string;
    available: string;
    use: number;
  }>;
  cpuHistory: number[];
  networkHistory: number[];
  testId?: string;
}

export function DeviceDetailsTable({
  os,
  cpuUsage,
  cpuBreakdown,
  ramUsage,
  ramUsagePercent,
  networkUsage,
  loadAverage,
  loadCurrentLoad,
  monitors,
  macAddress,
  systemUptime,
  hostname,
  platform,
  architecture,
  networkInterfaces,
  diskDetails,
  cpuHistory,
  networkHistory,
  testId,
}: DeviceDetailsTableProps) {
  return (
    <div className="space-y-6" data-testid={testId}>
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Thông tin hệ điều hành và định danh thiết bị
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Hostname
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="hostname"
              >
                {hostname}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Operating System
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="os"
              >
                {os}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Platform / Arch
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="platform"
              >
                {platform}
              </p>
              <p
                className="text-xs text-muted-foreground"
                data-testid="architecture"
              >
                {architecture}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Uptime / Monitors
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="system-uptime"
              >
                {systemUptime}
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="monitors"
              >
                {monitors} monitor(s)
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Primary MAC
              </p>
              <p
                className="mt-2 text-sm font-semibold text-foreground"
                data-testid="primary-mac"
              >
                {macAddress}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            CPU, RAM, network và tải hệ thống theo thời gian thực
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemMetrics
            cpuUsage={cpuUsage}
            cpuBreakdown={cpuBreakdown}
            ramUsage={ramUsage}
            ramUsagePercent={ramUsagePercent}
            networkUsage={networkUsage}
            loadAverage={loadAverage}
            loadCurrentLoad={loadCurrentLoad}
            cpuHistory={cpuHistory}
            networkHistory={networkHistory}
            testId="system-metrics"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Interfaces</CardTitle>
          <CardDescription>
            Danh sách card mạng và địa chỉ IP/MAC từ backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          {networkInterfaces.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="network-empty"
            >
              No network interface data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interface</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>IPv4</TableHead>
                  <TableHead>IPv6</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networkInterfaces.map((item) => (
                  <TableRow
                    key={`${item.iface}-${item.mac}`}
                    data-testid={`network-${item.iface}`}
                  >
                    <TableCell className="font-medium">{item.iface}</TableCell>
                    <TableCell className="capitalize">
                      {item.operstate}
                    </TableCell>
                    <TableCell>{item.mac}</TableCell>
                    <TableCell>{item.ip4}</TableCell>
                    <TableCell
                      className="max-w-[320px] truncate"
                      title={item.ip6}
                    >
                      {item.ip6}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disk Usage</CardTitle>
          <CardDescription>
            Tình trạng sử dụng phân vùng đĩa từ payload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {diskDetails.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="disk-empty"
            >
              No disk data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mount</TableHead>
                  <TableHead>FS</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="min-w-48">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diskDetails.map((disk) => (
                  <TableRow
                    key={`${disk.fs}-${disk.mount}`}
                    data-testid={`disk-${disk.mount}`}
                  >
                    <TableCell className="font-medium">{disk.mount}</TableCell>
                    <TableCell>{disk.fs}</TableCell>
                    <TableCell>{disk.type}</TableCell>
                    <TableCell>{disk.used}</TableCell>
                    <TableCell>{disk.available}</TableCell>
                    <TableCell>{disk.size}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {disk.use.toFixed(2)}%
                          </span>
                        </div>
                        <Progress value={disk.use} className="h-2" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
