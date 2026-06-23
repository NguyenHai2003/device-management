"use strict";

// jest is available as a global — no import needed

// ─── Mock external modules before requiring the service ───────────────────────
jest.mock("systeminformation", () => ({
  currentLoad: jest.fn(),
  graphics: jest.fn(),
  osInfo: jest.fn(),
  networkStats: jest.fn(),
  fsSize: jest.fn(),
  networkInterfaces: jest.fn(),
}));

jest.mock("os", () => ({
  totalmem: jest.fn(),
  freemem: jest.fn(),
  uptime: jest.fn(),
  platform: jest.fn(),
}));

let SystemService;
let si;
let os;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // Require AFTER resetModules so we get the fresh mock instances for this test run
  si = require("systeminformation");
  os = require("os");

  // Provide sensible defaults
  os.totalmem.mockReturnValue(16 * 1024 ** 3); // 16 GB
  os.freemem.mockReturnValue(8 * 1024 ** 3);   // 8 GB free
  os.uptime.mockReturnValue(3600);
  os.platform.mockReturnValue("linux");

  si.currentLoad.mockResolvedValue({
    currentLoad: 42.5,
    currentLoadUser: 30,
    currentLoadSystem: 12.5,
    avgLoad: 1.2,
  });

  si.graphics.mockResolvedValue({ displays: [{}, {}] }); // 2 monitors
  si.osInfo.mockResolvedValue({
    platform: "linux",
    distro: "Ubuntu",
    release: "22.04",
    arch: "x64",
    hostname: "test-machine",
  });
  si.networkStats.mockResolvedValue([
    { rx_bytes: 1000, tx_bytes: 500, rx_sec: 100, tx_sec: 50 },
    { rx_bytes: 2000, tx_bytes: 1000, rx_sec: 200, tx_sec: 100 },
  ]);
  si.fsSize.mockResolvedValue([
    { fs: "/dev/sda1", type: "ext4", size: 500e9, used: 250e9, available: 250e9, use: 50, mount: "/" },
  ]);
  si.networkInterfaces.mockResolvedValue([
    { iface: "eth0", mac: "aa:bb:cc:dd:ee:ff", ip4: "192.168.1.1", ip6: "", operstate: "up", internal: false },
    { iface: "lo", mac: "00:00:00:00:00:00", ip4: "127.0.0.1", ip6: "", operstate: "up", internal: true },
  ]);

  SystemService = require("./systemService");
});

// ─── isFresh ─────────────────────────────────────────────────────────────────
describe("SystemService.isFresh()", () => {
  test("returns false when collectedAt is 0", () => {
    expect(SystemService.isFresh(0, 1000)).toBe(false);
  });

  test("returns true when within TTL", () => {
    const now = Date.now();
    expect(SystemService.isFresh(now - 500, 1000)).toBe(true);
  });

  test("returns false when past TTL", () => {
    const now = Date.now();
    expect(SystemService.isFresh(now - 2000, 1000)).toBe(false);
  });
});

// ─── collectLightMetrics ─────────────────────────────────────────────────────
describe("SystemService.collectLightMetrics()", () => {
  test("returns correctly shaped light metrics", async () => {
    const result = await SystemService.collectLightMetrics();

    expect(result.ram.total).toBe(16 * 1024 ** 3);
    expect(result.ram.used).toBe(8 * 1024 ** 3);
    expect(result.ram.available).toBe(8 * 1024 ** 3);
    expect(result.ram.free).toBe(8 * 1024 ** 3);

    expect(result.cpuUsage.currentLoad).toBe(42.5);
    expect(result.cpuUsage.user).toBe(30);
    expect(result.cpuUsage.system).toBe(12.5);

    expect(result.uptime).toBe(3600);
    expect(result.loadAverage.currentLoad).toBe(42.5);
  });

  test("loadAverage.avg1 is null on Windows", async () => {
    os.platform.mockReturnValue("win32");
    const result = await SystemService.collectLightMetrics();
    expect(result.loadAverage.avg1).toBeNull();
  });

  test("loadAverage.avg1 is a number on Linux", async () => {
    const result = await SystemService.collectLightMetrics();
    expect(typeof result.loadAverage.avg1).toBe("number");
  });

  test("throws when systeminformation fails", async () => {
    si.currentLoad.mockRejectedValue(new Error("si failure"));
    await expect(SystemService.collectLightMetrics()).rejects.toThrow("Failed to retrieve light metrics");
  });
});

// ─── collectHeavyMetrics ─────────────────────────────────────────────────────
describe("SystemService.collectHeavyMetrics()", () => {
  test("returns correct monitor count", async () => {
    const result = await SystemService.collectHeavyMetrics();
    expect(result.monitors).toBe(2);
  });

  test("sums network stats across all interfaces", async () => {
    const result = await SystemService.collectHeavyMetrics();
    expect(result.networkUsage.rx_bytes).toBe(3000);
    expect(result.networkUsage.tx_bytes).toBe(1500);
    expect(result.networkUsage.rx_sec).toBe(300);
    expect(result.networkUsage.tx_sec).toBe(150);
  });

  test("filters out internal and zero-MAC interfaces", async () => {
    const result = await SystemService.collectHeavyMetrics();
    // lo (internal) and 00:00:00:00:00:00 should be excluded
    expect(result.macAddresses).toHaveLength(1);
    expect(result.macAddresses[0].iface).toBe("eth0");
  });

  test("picks primary MAC from 'up' interface", async () => {
    const result = await SystemService.collectHeavyMetrics();
    expect(result.macAddress).toBe("aa:bb:cc:dd:ee:ff");
  });

  test("returns null macAddress when no valid interfaces", async () => {
    si.networkInterfaces.mockResolvedValue([]);
    const result = await SystemService.collectHeavyMetrics();
    expect(result.macAddress).toBeNull();
  });

  test("maps disk usage correctly", async () => {
    const result = await SystemService.collectHeavyMetrics();
    expect(result.diskUsage).toHaveLength(1);
    expect(result.diskUsage[0].mount).toBe("/");
    expect(result.diskUsage[0].use).toBe(50);
  });

  test("returns 0 monitors when no displays", async () => {
    si.graphics.mockResolvedValue({ displays: [] });
    const result = await SystemService.collectHeavyMetrics();
    expect(result.monitors).toBe(0);
  });
});

// ─── getLightMetrics — caching ────────────────────────────────────────────────
describe("SystemService.getLightMetrics() — cache", () => {
  test("calls collectLightMetrics only once on repeated calls within TTL", async () => {
    await SystemService.getLightMetrics();
    await SystemService.getLightMetrics();
    expect(si.currentLoad).toHaveBeenCalledTimes(1);
  });
});

// ─── getHeavyMetricsSnapshot ──────────────────────────────────────────────────
describe("SystemService.getHeavyMetricsSnapshot()", () => {
  test("returns defaultHeavyMetrics when no cache exists yet", () => {
    const snapshot = SystemService.getHeavyMetricsSnapshot();
    expect(snapshot.monitors).toBe(0);
    expect(snapshot.macAddress).toBeNull();
    expect(snapshot.diskUsage).toEqual([]);
  });
});

// ─── getSystemMetrics ─────────────────────────────────────────────────────────
describe("SystemService.getSystemMetrics()", () => {
  test("merges light and heavy metrics into final payload shape", async () => {
    const result = await SystemService.getSystemMetrics();

    expect(result).toHaveProperty("ram");
    expect(result).toHaveProperty("cpuUsage");
    expect(result).toHaveProperty("uptime");
    expect(result).toHaveProperty("loadAverage");
    expect(result).toHaveProperty("monitors");
    expect(result).toHaveProperty("networkUsage");
    expect(result).toHaveProperty("diskUsage");
    expect(result).toHaveProperty("macAddress");
    expect(result).toHaveProperty("macAddresses");
    expect(result).toHaveProperty("osInfo");
  });
});
