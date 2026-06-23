import { render, screen } from "@testing-library/react";
import { DeviceDetailsTable } from "@/components/dashboard/DeviceDetailsTable";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const baseProps = {
  os: "Ubuntu 22.04",
  cpuUsage: 40,
  cpuBreakdown: { user: 25, system: 15 },
  ramUsage: { total: "16 GB", used: "8 GB", available: "8 GB", free: "7 GB" },
  ramUsagePercent: 50,
  networkUsage: { up: "50 B/s", down: "100 B/s", txTotal: "1 KB", rxTotal: "2 KB" },
  loadAverage: 0.8 as number | null,
  loadCurrentLoad: 40,
  monitors: 2,
  macAddress: "aa:bb:cc:dd:ee:ff",
  systemUptime: "2 hours",
  hostname: "my-machine",
  platform: "linux",
  architecture: "x64",
  networkInterfaces: [
    { iface: "eth0", mac: "aa:bb:cc:dd:ee:ff", ip4: "192.168.1.1", ip6: "", operstate: "up" },
  ],
  diskDetails: [
    { fs: "/dev/sda1", type: "ext4", mount: "/", size: "500 GB", used: "250 GB", available: "250 GB", use: 50 },
  ],
  cpuHistory: Array(8).fill(0),
  networkHistory: Array(8).fill(0),
  testId: "device-details",
};

describe("DeviceDetailsTable — System Overview", () => {
  test("renders hostname", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("hostname")).toHaveTextContent("my-machine");
  });

  test("renders OS", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("os")).toHaveTextContent("Ubuntu 22.04");
  });

  test("renders platform and architecture", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("platform")).toHaveTextContent("linux");
    expect(screen.getByTestId("architecture")).toHaveTextContent("x64");
  });

  test("renders uptime and monitor count", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("system-uptime")).toHaveTextContent("2 hours");
    expect(screen.getByTestId("monitors")).toHaveTextContent("2 monitor");
  });

  test("renders primary MAC address", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("primary-mac")).toHaveTextContent("aa:bb:cc:dd:ee:ff");
  });
});

describe("DeviceDetailsTable — Network Interfaces table", () => {
  test("renders network interface row", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("network-eth0")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
  });

  test("shows empty state when no network interfaces", () => {
    render(<DeviceDetailsTable {...baseProps} networkInterfaces={[]} />);
    expect(screen.getByTestId("network-empty")).toBeInTheDocument();
  });
});

describe("DeviceDetailsTable — Disk Usage table", () => {
  test("renders disk row with mount point", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByTestId("disk-/")).toBeInTheDocument();
    expect(screen.getAllByText("250 GB")[0]).toBeInTheDocument(); // used column
  });

  test("shows empty state when no disk data", () => {
    render(<DeviceDetailsTable {...baseProps} diskDetails={[]} />);
    expect(screen.getByTestId("disk-empty")).toBeInTheDocument();
  });

  test("renders disk usage percentage", () => {
    render(<DeviceDetailsTable {...baseProps} />);
    expect(screen.getByText("50.00%")).toBeInTheDocument();
  });
});
