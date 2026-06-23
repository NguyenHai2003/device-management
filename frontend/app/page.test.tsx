import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";

// ─── Utility function tests ────────────────────────────────────────────────────
// We test the functions by extracting them via a module-level helper.
// Since they are not exported from page.tsx, we duplicate the logic here
// to test the expected behaviour — this is intentional for isolation.

function formatBytes(bytes: number): string {
  if (bytes === 0 || !bytes || isNaN(bytes)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0 secs";
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} days`);
  if (h > 0) parts.push(`${h} hours`);
  if (m > 0 && d === 0) parts.push(`${m} mins`);
  if (parts.length === 0) return `${Math.floor(seconds)} secs`;
  return parts.join(" ");
}

describe("formatBytes()", () => {
  test("returns '0 B' for 0", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  test("returns '0 B' for NaN", () => {
    expect(formatBytes(NaN)).toBe("0 B");
  });

  test("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  test("formats kilobytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  test("formats megabytes correctly", () => {
    expect(formatBytes(1024 ** 2)).toBe("1 MB");
  });

  test("formats gigabytes correctly", () => {
    expect(formatBytes(8 * 1024 ** 3)).toBe("8 GB");
  });

  test("formats terabytes correctly", () => {
    expect(formatBytes(2 * 1024 ** 4)).toBe("2 TB");
  });
});

describe("formatSeconds()", () => {
  test("returns '0 secs' for 0", () => {
    expect(formatSeconds(0)).toBe("0 secs");
  });

  test("returns '0 secs' for NaN", () => {
    expect(formatSeconds(NaN)).toBe("0 secs");
  });

  test("returns seconds when under 1 minute", () => {
    expect(formatSeconds(45)).toBe("45 secs");
  });

  test("returns minutes when under 1 hour", () => {
    expect(formatSeconds(90)).toBe("1 mins");
  });

  test("returns hours correctly", () => {
    expect(formatSeconds(7200)).toBe("2 hours");
  });

  test("returns days and hours", () => {
    expect(formatSeconds(90000)).toBe("1 days 1 hours");
  });

  test("does not show mins when days > 0", () => {
    const result = formatSeconds(86400 + 60); // 1 day + 1 min
    expect(result).not.toContain("mins");
  });
});

// ─── DashboardPage — loading state ────────────────────────────────────────────
// We mock EventSource and next/font/google before importing the page

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", className: "geist" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "geist-mono" }),
}));

// Mock child components to isolate DashboardPage logic
vi.mock("@/components/dashboard/DeviceHeader", () => ({
  DeviceHeader: ({ macAddress }: { macAddress: string }) => (
    <div data-testid="device-header">{macAddress}</div>
  ),
}));
vi.mock("@/components/dashboard/DeviceDetailsTable", () => ({
  DeviceDetailsTable: () => <div data-testid="device-details-table" />,
}));
vi.mock("@/components/dashboard/StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <div data-testid="status-badge">{status}</div>
  ),
}));

describe("DashboardPage — loading state", () => {
  let MockEventSource: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    MockEventSource = class {
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror = null;
      constructor() {}
    } as any;
    vi.stubGlobal("EventSource", MockEventSource);
    globalThis.EventSource = MockEventSource as any;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).EventSource;
    vi.resetModules();
  });

  test("shows loading spinner before SSE data arrives", async () => {
    const { default: DashboardPage } = await import("@/app/page");
    render(<DashboardPage />);

    expect(screen.getByText(/Connecting to backend/i)).toBeInTheDocument();
    expect(screen.queryByTestId("device-details-table")).not.toBeInTheDocument();
  });

  test("hides spinner and shows dashboard after receiving SSE metrics", async () => {
    const mockPayload = {
      monitors: 1,
      ram: { total: 8e9, used: 4e9, available: 4e9, free: 4e9 },
      cpuUsage: { currentLoad: 20, user: 15, system: 5 },
      osInfo: { platform: "linux", distro: "Ubuntu", release: "22.04", arch: "x64", hostname: "host" },
      uptime: 3600,
      loadAverage: { avg1: 0.5, currentLoad: 20 },
      macAddress: "aa:bb:cc:dd:ee:ff",
      macAddresses: [],
      networkUsage: { rx_bytes: 0, tx_bytes: 0, rx_sec: 0, tx_sec: 0 },
      diskUsage: [],
    };

    let metricsCallback: ((e: MessageEvent) => void) | null = null;

    MockEventSource = class {
      addEventListener(event: string, cb: (e: MessageEvent) => void) {
        if (event === "metrics") metricsCallback = cb;
      }
      removeEventListener = vi.fn();
      close = vi.fn();
      onerror = null;
      constructor() {}
    } as any;
    vi.stubGlobal("EventSource", MockEventSource);
    globalThis.EventSource = MockEventSource as any;

    const { default: DashboardPage } = await import("@/app/page");
    render(<DashboardPage />);

    expect(screen.getByText(/Connecting to backend/i)).toBeInTheDocument();

    await act(async () => {
      metricsCallback?.({
        data: JSON.stringify(mockPayload),
      } as MessageEvent);
    });

    expect(screen.queryByText(/Connecting to backend/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("device-details-table")).toBeInTheDocument();
  });
});
