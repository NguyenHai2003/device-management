"use client";

import { useState, useEffect } from "react";
import { DeviceHeader } from "@/components/dashboard/DeviceHeader";
import { DeviceDetailsTable } from "@/components/dashboard/DeviceDetailsTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface BackendMetricsPayload {
  monitors?: number;
  ram?: {
    total?: number;
    used?: number;
    available?: number;
    free?: number;
  };
  cpuUsage?: {
    currentLoad?: number;
    user?: number;
    system?: number;
  };
  osInfo?: {
    platform?: string;
    distro?: string;
    release?: string;
    arch?: string;
    hostname?: string;
  };
  uptime?: number;
  loadAverage?: {
    avg1?: number | null;
    currentLoad?: number;
  };
  macAddress?: string;
  macAddresses?: Array<{
    iface?: string;
    mac?: string;
    ip4?: string;
    ip6?: string;
    operstate?: string;
  }>;
  networkUsage?: {
    rx_bytes?: number;
    tx_bytes?: number;
    rx_sec?: number;
    tx_sec?: number;
  };
  diskUsage?: Array<{
    fs?: string;
    type?: string;
    size?: number;
    used?: number;
    available?: number;
    use?: number;
    mount?: string;
  }>;
}

// --- Utility Functions ---
const formatBytes = (bytes: number) => {
  if (bytes === 0 || !bytes || isNaN(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatSeconds = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0 secs";
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d} days`);
  if (h > 0) parts.push(`${h} hours`);
  if (m > 0 && d === 0) parts.push(`${m} mins`); // Only show mins if no days for brevity
  if (parts.length === 0) return `${Math.floor(seconds)} secs`;
  return parts.join(" ");
};

// Initial Placeholder data (fallback/initial state before connection)
const INITIAL_DEVICE_DATA = {
  deviceId: "device-001",
  macAddress: "Unknown",
  status: "offline" as "online" | "offline",
  os: "Unknown OS",
  cpuUsage: 0,
  cpuBreakdown: { user: 0, system: 0 },
  ramUsage: { total: 0, used: 0, available: 0, free: 0 },
  loadAverage: null as number | null,
  loadCurrentLoad: 0,
  networkUsage: {
    upBytesPerSec: 0,
    downBytesPerSec: 0,
    txBytesTotal: 0,
    rxBytesTotal: 0,
  },
  diskDetails: [] as Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
    mount: string;
  }>,
  monitors: 0,
  networkInterfaces: [] as Array<{
    iface: string;
    mac: string;
    ip4: string;
    ip6: string;
    operstate: string;
  }>,
  systemUptime: "0 mins",
  hostname: "Unknown",
  platform: "Unknown",
  architecture: "Unknown",
};

export default function DashboardPage() {
  const [deviceData, setDeviceData] = useState(INITIAL_DEVICE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(8).fill(0));
  const [networkHistory, setNetworkHistory] = useState<number[]>(
    Array(8).fill(0),
  );
  if (!process.env.NEXT_PUBLIC_METRICS_SSE_URL) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_METRICS_SSE_URL");
  }

  const metricsSseUrl = process.env.NEXT_PUBLIC_METRICS_SSE_URL;
  useEffect(() => {
    // Connect to SSE Endpoint
    const eventSource = new EventSource(metricsSseUrl);

    const handleMetricsPayload = (event: MessageEvent) => {
      try {
        const data: BackendMetricsPayload = JSON.parse(event.data);

        // --- Process and Format Data ---
        const rxSec = data.networkUsage?.rx_sec || 0;
        const txSec = data.networkUsage?.tx_sec || 0;
        // History Data for Charts (mocking history logic by keeping last 8 records)
        const newCpuLoad = data.cpuUsage?.currentLoad ?? 0;
        // Approximation of network load percentage for chart: arbitrary max scaling for visual (ex: 10MB/s = 100%)
        const maxNetworkExpectedBytes = 10 * 1024 * 1024;
        const newNetworkLoad = Math.min(
          ((rxSec + txSec) / maxNetworkExpectedBytes) * 100,
          100,
        );

        setCpuHistory((prev) => [...prev.slice(1), newCpuLoad]);
        setNetworkHistory((prev) => [...prev.slice(1), newNetworkLoad]);

        setDeviceData((prev) => ({
          ...prev,
          status: "online",
          macAddress: data.macAddress || prev.macAddress,
          hostname: data.osInfo?.hostname || prev.hostname,
          platform: data.osInfo?.platform || prev.platform,
          architecture: data.osInfo?.arch || prev.architecture,
          os:
            [data.osInfo?.distro, data.osInfo?.release]
              .filter(Boolean)
              .join(" ") || prev.os,
          cpuUsage: Math.min(Math.max(Math.round(newCpuLoad), 0), 100),
          cpuBreakdown: {
            user: Number((data.cpuUsage?.user ?? 0).toFixed(2)),
            system: Number((data.cpuUsage?.system ?? 0).toFixed(2)),
          },
          ramUsage: {
            total: data.ram?.total ?? 0,
            used: data.ram?.used ?? 0,
            available: data.ram?.available ?? 0,
            free: data.ram?.free ?? data.ram?.available ?? 0,
          },
          loadAverage:
            data.loadAverage?.avg1 != null
              ? Number(data.loadAverage.avg1.toFixed(2))
              : null,
          loadCurrentLoad:
            typeof data.loadAverage?.currentLoad === "number"
              ? Number(data.loadAverage.currentLoad.toFixed(2))
              : 0,
          networkUsage: {
            upBytesPerSec: txSec,
            downBytesPerSec: rxSec,
            txBytesTotal: data.networkUsage?.tx_bytes ?? 0,
            rxBytesTotal: data.networkUsage?.rx_bytes ?? 0,
          },
          diskDetails: (data.diskUsage ?? []).map((disk) => ({
            fs: disk.fs ?? "Unknown",
            type: disk.type ?? "Unknown",
            size: disk.size ?? 0,
            used: disk.used ?? 0,
            available: disk.available ?? 0,
            use: typeof disk.use === "number" ? Number(disk.use.toFixed(2)) : 0,
            mount: disk.mount ?? "Unknown",
          })),
          monitors: data.monitors || 0,
          networkInterfaces: (data.macAddresses ?? []).map((item) => ({
            iface: item.iface ?? "Unknown",
            mac: item.mac ?? "Unknown",
            ip4: item.ip4 || "-",
            ip6: item.ip6 || "-",
            operstate: item.operstate ?? "unknown",
          })),
          systemUptime: formatSeconds(data.uptime || 0),
        }));
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };

    eventSource.addEventListener("metrics", handleMetricsPayload);
    eventSource.addEventListener("message", handleMetricsPayload);

    eventSource.onerror = () => {
      console.warn("SSE connection lost or failed. Reconnecting...");
      // Update state to offline when connection drops
      setDeviceData((prev) => ({ ...prev, status: "offline" }));
    };

    return () => {
      console.log("Cleaning up EventSource");
      eventSource.removeEventListener("metrics", handleMetricsPayload);
      eventSource.removeEventListener("message", handleMetricsPayload);
      eventSource.close();
    };
  }, [metricsSseUrl]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Connecting to backend…</p>
            </div>
          </div>
        )}
        {!isLoading && (
          <>
            <div className="flex items-center justify-between mb-8">
              <DeviceHeader
                macAddress={deviceData.macAddress}
                testId="device-header"
              />
              <StatusBadge status={deviceData.status} testId="status-badge" />
            </div>

            <DeviceDetailsTable
              os={deviceData.os}
              cpuUsage={deviceData.cpuUsage}
              cpuBreakdown={deviceData.cpuBreakdown}
              ramUsage={{
                total: formatBytes(deviceData.ramUsage.total),
                used: formatBytes(deviceData.ramUsage.used),
                available: formatBytes(deviceData.ramUsage.available),
                free: formatBytes(deviceData.ramUsage.free),
              }}
              ramUsagePercent={
                deviceData.ramUsage.total > 0
                  ? Math.min(
                      (deviceData.ramUsage.used / deviceData.ramUsage.total) *
                        100,
                      100,
                    )
                  : 0
              }
              networkUsage={{
                up: `${formatBytes(deviceData.networkUsage.upBytesPerSec)}/s`,
                down: `${formatBytes(deviceData.networkUsage.downBytesPerSec)}/s`,
                txTotal: formatBytes(deviceData.networkUsage.txBytesTotal),
                rxTotal: formatBytes(deviceData.networkUsage.rxBytesTotal),
              }}
              loadAverage={deviceData.loadAverage}
              loadCurrentLoad={deviceData.loadCurrentLoad}
              monitors={deviceData.monitors}
              macAddress={deviceData.macAddress}
              systemUptime={deviceData.systemUptime}
              hostname={deviceData.hostname}
              platform={deviceData.platform}
              architecture={deviceData.architecture}
              networkInterfaces={deviceData.networkInterfaces}
              diskDetails={deviceData.diskDetails.map((disk) => ({
                fs: disk.fs,
                type: disk.type,
                mount: disk.mount,
                size: formatBytes(disk.size),
                used: formatBytes(disk.used),
                available: formatBytes(disk.available),
                use: disk.use,
              }))}
              cpuHistory={cpuHistory}
              networkHistory={networkHistory}
              testId="device-details-table"
            />
          </>
        )}
      </div>
    </main>
  );
}
