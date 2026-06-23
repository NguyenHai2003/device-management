"use strict";

// jest is available as a global — no import needed
const request = require("supertest");

// Mock systemService so integration tests don't rely on real system metrics
jest.mock("../services/systemService", () => ({
  getSystemMetrics: jest.fn().mockResolvedValue({
    monitors: 2,
    ram: { total: 16e9, used: 8e9, available: 8e9, free: 8e9 },
    cpuUsage: { currentLoad: 35, user: 25, system: 10 },
    osInfo: { platform: "linux", distro: "Ubuntu", release: "22.04", arch: "x64", hostname: "test-host" },
    uptime: 7200,
    loadAverage: { avg1: 0.8, currentLoad: 35 },
    macAddress: "aa:bb:cc:dd:ee:ff",
    macAddresses: [{ iface: "eth0", mac: "aa:bb:cc:dd:ee:ff", ip4: "10.0.0.1", ip6: "", operstate: "up" }],
    networkUsage: { rx_bytes: 5000, tx_bytes: 2000, rx_sec: 100, tx_sec: 50 },
    diskUsage: [{ fs: "/dev/sda1", type: "ext4", size: 100e9, used: 50e9, available: 50e9, use: 50, mount: "/" }],
  }),
}));

// We import the express app directly (not the listening server)
const express = require("express");
const cors = require("cors");
const monitorRoutes = require("../routes/monitorRoutes");

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", monitorRoutes);
  app.get("/", (_req, res) => res.send("OK"));
  return app;
}

let app;
beforeAll(() => {
  app = createApp();
});

afterAll(() => {
  // Clean up SSE controller state
  const controller = require("../controllers/monitorController");
  controller.clients.clear();
  controller.stopBackgroundLoops();
});

// ─── Health endpoint ──────────────────────────────────────────────────────────
describe("GET /", () => {
  test("returns 200 with status text", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBeTruthy();
  });
});

// ─── SSE endpoint ─────────────────────────────────────────────────────────────
describe("GET /api/system-metrics", () => {
  test("returns 200 with text/event-stream content-type", (done) => {
    let timeoutId;
    const req = request(app)
      .get("/api/system-metrics")
      .buffer(false)
      .parse((res, callback) => {
        res.setEncoding("utf8");
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;

          // Once we have a complete metrics event, verify and abort
          if (data.includes("event: metrics") && data.includes("data:")) {
            clearTimeout(timeoutId);
            
            // Verify headers
            expect(res.headers["content-type"]).toContain("text/event-stream");
            expect(res.headers["cache-control"]).toBe("no-cache");
            expect(res.headers["connection"]).toBe("keep-alive");

            // Verify payload shape
            const dataLine = data.split("\n").find((l) => l.startsWith("data:"));
            if (dataLine) {
              const payload = JSON.parse(dataLine.replace("data:", "").trim());
              expect(typeof payload.monitors).toBe("number");
              expect(payload.ram).toBeDefined();
              expect(payload.cpuUsage).toBeDefined();
              expect(payload.networkUsage).toBeDefined();
              expect(payload.diskUsage).toBeDefined();
            }

            res.destroy();
            callback(null, data);
          }
        });

        res.on("error", (err) => {
          clearTimeout(timeoutId);
          callback(err);
        });
        
        // Timeout guard
        timeoutId = setTimeout(() => {
          res.destroy();
          callback(new Error("Timeout: no SSE metrics event received"));
        }, 6000);
      });

    req.end((err) => {
      if (err && err.message.includes("Timeout")) {
        done(err);
      } else {
        done();
      }
    });
  }, 10000);

  test("SSE response includes retry directive", (done) => {
    let timeoutId;
    const req = request(app)
      .get("/api/system-metrics")
      .buffer(false)
      .parse((res, callback) => {
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
          if (data.includes("retry:")) {
            clearTimeout(timeoutId);
            res.destroy();
            callback(null, data);
          }
        });
        res.on("error", (err) => {
          clearTimeout(timeoutId);
          callback(err);
        });
        timeoutId = setTimeout(() => { res.destroy(); callback(new Error("Timeout")); }, 4000);
      });

    req.end((err) => {
      if (err && err.message === "Timeout") done(err);
      else done();
    });
  }, 8000);
});
