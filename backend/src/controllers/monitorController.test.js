"use strict";

// jest is available as a global — no import needed

// Mock systemService so controller tests don't hit real system calls
jest.mock("../services/systemService", () => ({
  getSystemMetrics: jest.fn().mockResolvedValue({
    monitors: 1,
    ram: { total: 8e9, used: 4e9, available: 4e9, free: 4e9 },
    cpuUsage: { currentLoad: 20, user: 15, system: 5 },
    osInfo: { platform: "linux", distro: "Ubuntu", release: "22.04", arch: "x64", hostname: "host" },
    uptime: 1800,
    loadAverage: { avg1: 0.5, currentLoad: 20 },
    macAddress: "aa:bb:cc:dd:ee:ff",
    macAddresses: [],
    networkUsage: { rx_bytes: 0, tx_bytes: 0, rx_sec: 0, tx_sec: 0 },
    diskUsage: [],
  }),
}));

// Helper: create a mock Express response object
function makeMockRes() {
  const res = {
    written: [],
    ended: false,
    headers: {},
    setHeader: jest.fn((k, v) => { res.headers[k] = v; }),
    flushHeaders: jest.fn(),
    write: jest.fn((chunk) => { res.written.push(chunk); return true; }),
    end: jest.fn(() => { res.ended = true; }),
    on: jest.fn(),
  };
  return res;
}

function makeMockReq() {
  return { on: jest.fn() };
}

let MonitorController;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.resetModules();
  MonitorController = require("../controllers/monitorController");
});

afterEach(() => {
  jest.useRealTimers();
  // Clean up any lingering clients
  MonitorController.clients.clear();
  MonitorController.stopBackgroundLoops();
});

// ─── Client management ────────────────────────────────────────────────────────
describe("Client management", () => {
  test("createClientRecord adds client and increments id", () => {
    const res = makeMockRes();
    const client = MonitorController.createClientRecord(res);

    expect(client.id).toBe(1);
    expect(MonitorController.clients.size).toBe(1);

    const client2 = MonitorController.createClientRecord(makeMockRes());
    expect(client2.id).toBe(2);
    expect(MonitorController.clients.size).toBe(2);
  });

  test("removeClient deletes the client", () => {
    const res = makeMockRes();
    const client = MonitorController.createClientRecord(res);
    MonitorController.removeClient(client.id);

    expect(MonitorController.clients.size).toBe(0);
  });

  test("removeClient stops background loops when last client disconnects", () => {
    const stopSpy = jest.spyOn(MonitorController, "stopBackgroundLoops");
    const client = MonitorController.createClientRecord(makeMockRes());
    MonitorController.removeClient(client.id);

    expect(stopSpy).toHaveBeenCalled();
  });
});

// ─── writeToClient ────────────────────────────────────────────────────────────
describe("writeToClient()", () => {
  test("writes chunk to res and returns true", () => {
    const res = makeMockRes();
    const client = MonitorController.createClientRecord(res);
    const ok = MonitorController.writeToClient(client, "hello");

    expect(ok).toBe(true);
    expect(res.write).toHaveBeenCalledWith("hello");
  });

  test("returns false and removes client when write throws", () => {
    const res = makeMockRes();
    res.write.mockImplementation(() => { throw new Error("pipe broken"); });
    const client = MonitorController.createClientRecord(res);

    const ok = MonitorController.writeToClient(client, "data");
    expect(ok).toBe(false);
    expect(MonitorController.clients.has(client.id)).toBe(false);
  });
});

// ─── broadcastEvent ───────────────────────────────────────────────────────────
describe("broadcastEvent()", () => {
  test("writes correct SSE format to all clients", () => {
    const res1 = makeMockRes();
    const res2 = makeMockRes();
    MonitorController.createClientRecord(res1);
    MonitorController.createClientRecord(res2);

    MonitorController.broadcastEvent("metrics", { cpu: 42 });

    const expected = `id: 1\nevent: metrics\ndata: ${JSON.stringify({ cpu: 42 })}\n\n`;
    expect(res1.write).toHaveBeenCalledWith(expected);
    expect(res2.write).toHaveBeenCalledWith(expected);
  });

  test("does nothing when no clients connected", () => {
    // Should not throw
    expect(() => MonitorController.broadcastEvent("metrics", {})).not.toThrow();
  });

  test("increments lastEventId with each broadcast", () => {
    MonitorController.createClientRecord(makeMockRes());
    const before = MonitorController.lastEventId;
    MonitorController.broadcastEvent("metrics", {});
    expect(MonitorController.lastEventId).toBe(before + 1);
  });
});

// ─── broadcastHeartbeat ───────────────────────────────────────────────────────
describe("broadcastHeartbeat()", () => {
  test("writes heartbeat comment to all clients", () => {
    const res = makeMockRes();
    MonitorController.createClientRecord(res);
    MonitorController.broadcastHeartbeat();

    expect(res.write).toHaveBeenCalledWith(": heartbeat\n\n");
  });
});

// ─── Polling loop — idempotency ────────────────────────────────────────────────
describe("startPollingLoop()", () => {
  test("does not create duplicate timers on repeated calls", () => {
    MonitorController.createClientRecord(makeMockRes());
    MonitorController.startPollingLoop();
    const id1 = MonitorController.pollTimeoutId;
    MonitorController.startPollingLoop();
    const id2 = MonitorController.pollTimeoutId;

    expect(id1).toBe(id2);
  });
});

describe("stopPollingLoop()", () => {
  test("clears timer and sets pollTimeoutId to null", () => {
    MonitorController.createClientRecord(makeMockRes());
    MonitorController.startPollingLoop();
    MonitorController.stopPollingLoop();

    expect(MonitorController.pollTimeoutId).toBeNull();
  });
});

// ─── streamMetrics ────────────────────────────────────────────────────────────
describe("streamMetrics()", () => {
  test("sets correct SSE response headers", async () => {
    const res = makeMockRes();
    res.on.mockImplementation((event, cb) => {
      if (event === "close") cb(); // immediately close to avoid hanging
    });
    const req = makeMockReq();

    await MonitorController.streamMetrics(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(res.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(res.flushHeaders).toHaveBeenCalled();
  });

  test("sends retry hint to new client", async () => {
    const res = makeMockRes();
    res.on.mockImplementation((event, cb) => {
      if (event === "close") cb();
    });
    const req = makeMockReq();

    await MonitorController.streamMetrics(req, res);

    const writtenChunks = res.write.mock.calls.map((c) => c[0]).join("");
    expect(writtenChunks).toContain("retry:");
  });
});

// ─── parseIntervalMs ──────────────────────────────────────────────────────────
describe("parseIntervalMs()", () => {
  test("returns fallback when env var is not set", () => {
    const result = MonitorController.parseIntervalMs({
      envName: "NON_EXISTENT_VAR_XYZ",
      fallback: 2000,
      min: 500,
      max: 60000,
    });
    expect(result).toBe(2000);
  });

  test("returns fallback when env var is out of range", () => {
    process.env.TEST_INTERVAL_VAR = "99999999";
    const result = MonitorController.parseIntervalMs({
      envName: "TEST_INTERVAL_VAR",
      fallback: 2000,
      min: 500,
      max: 60000,
    });
    expect(result).toBe(2000);
    delete process.env.TEST_INTERVAL_VAR;
  });

  test("returns parsed value when env var is valid", () => {
    process.env.TEST_INTERVAL_VAR2 = "3000";
    const result = MonitorController.parseIntervalMs({
      envName: "TEST_INTERVAL_VAR2",
      fallback: 2000,
      min: 500,
      max: 60000,
    });
    expect(result).toBe(3000);
    delete process.env.TEST_INTERVAL_VAR2;
  });
});
