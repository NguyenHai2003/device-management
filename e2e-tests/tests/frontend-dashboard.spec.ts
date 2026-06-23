import { test, expect } from '@playwright/test';

// Mock data to simulate Backend SSE stream
const mockMetrics = {
  monitors: 2,
  osInfo: {
    platform: 'linux',
    distro: 'Ubuntu',
    release: '22.04',
    arch: 'x64',
    hostname: 'test-machine'
  },
  macAddress: '00:11:22:33:44:55',
  cpuUsage: { currentLoad: 45.5, user: 30, system: 15.5 },
  ram: { total: 16000000000, used: 8000000000, available: 8000000000, free: 7000000000 },
  loadAverage: { avg1: 1.5, currentLoad: 45.5 },
  networkUsage: { tx_sec: 1024, rx_sec: 2048, tx_bytes: 50000, rx_bytes: 100000 },
  diskUsage: [{ fs: '/dev/sda1', type: 'ext4', size: 500000000000, used: 250000000000, available: 250000000000, use: 50, mount: '/' }],
  macAddresses: [{ iface: 'eth0', mac: '00:11:22:33:44:55', ip4: '192.168.1.5', ip6: '', operstate: 'up' }],
  uptime: 3600
};

/** Inject a MockEventSource that fires the given data after a short delay */
async function injectMockEventSource(page: import('@playwright/test').Page, data: object) {
  await page.addInitScript((mockData) => {
    class MockEventSource {
      url: string;
      readyState = 1;
      listeners: Record<string, Array<(e: MessageEvent) => void>> = {};
      onerror: ((e: Event) => void) | null = null;

      constructor(url: string) {
        this.url = url;
      }

      addEventListener(type: string, callback: (e: MessageEvent) => void) {
        this.listeners[type] = this.listeners[type] || [];
        this.listeners[type].push(callback);

        if (type === 'metrics') {
          setTimeout(() => {
            const event = new MessageEvent('metrics', { data: JSON.stringify(mockData) });
            this.listeners['metrics']?.forEach(cb => cb(event));
          }, 100);
        }
      }

      removeEventListener(type: string, callback: (e: MessageEvent) => void) {
        if (this.listeners[type]) {
          this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
        }
      }

      close() { this.readyState = 2; }
    }

    (window as any).EventSource = MockEventSource;
  }, data);
}

test.describe('Frontend Dashboard UI Tests', () => {

  // ─── Loading state ────────────────────────────────────────────────────────
  test('Should show loading spinner before SSE data arrives', async ({ page }) => {
    // Inject EventSource that NEVER fires
    await page.addInitScript(() => {
      (window as any).EventSource = class {
        addEventListener() {}
        removeEventListener() {}
        close() {}
      };
    });

    await page.goto('/');
    await expect(page.getByText(/Connecting to backend/i)).toBeVisible();
    // Dashboard content should NOT be visible yet
    await expect(page.getByTestId('device-details-table')).not.toBeVisible();
  });

  // ─── Full dashboard render ─────────────────────────────────────────────────
  test('Should render dashboard and process mock SSE data in real-time', async ({ page }) => {
    await injectMockEventSource(page, mockMetrics);
    await page.goto('/');

    // Header and status badge
    const header = page.getByTestId('device-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('00:11:22:33:44:55');

    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toContainText('Online', { ignoreCase: true });

    // System info
    await expect(page.locator('text=Ubuntu 22.04')).toBeVisible();
    await expect(page.locator('text=test-machine')).toBeVisible();
  });

  // ─── Disk usage table ─────────────────────────────────────────────────────
  test('Should render disk usage table with correct data', async ({ page }) => {
    await injectMockEventSource(page, mockMetrics);
    await page.goto('/');

    // Wait for data to load
    await expect(page.getByTestId('device-details-table')).toBeVisible({ timeout: 5000 });

    const diskRow = page.getByTestId('disk-/');
    await expect(diskRow).toBeVisible();
    await expect(diskRow).toContainText('/dev/sda1');
    await expect(diskRow).toContainText('50.00%');
  });

  // ─── Network interfaces table ─────────────────────────────────────────────
  test('Should render network interfaces table', async ({ page }) => {
    await injectMockEventSource(page, mockMetrics);
    await page.goto('/');

    await expect(page.getByTestId('device-details-table')).toBeVisible({ timeout: 5000 });

    const netRow = page.getByTestId('network-eth0');
    await expect(netRow).toBeVisible();
    await expect(netRow).toContainText('eth0');
    await expect(netRow).toContainText('192.168.1.5');
    await expect(netRow).toContainText('00:11:22:33:44:55');
  });

  // ─── loadAverage null (Windows simulation) ────────────────────────────────
  test('Should show N/A for loadAverage when backend returns null', async ({ page }) => {
    const metricsWithNullLoad = { ...mockMetrics, loadAverage: { avg1: null, currentLoad: 45.5 } };
    await injectMockEventSource(page, metricsWithNullLoad);
    await page.goto('/');

    await expect(page.getByTestId('device-details-table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('load-average')).toHaveText('N/A');
  });

  // ─── Offline / error state ────────────────────────────────────────────────
  test('Should handle offline/error connection from SSE', async ({ page }) => {
    await page.addInitScript((mockData) => {
      (window as any).EventSource = class {
        onerror: ((e: Event) => void) | null = null;
        callbacks: any = {};
        constructor() {
          // 1. Simulate successful connection first to render dashboard
          setTimeout(() => {
            if (this.callbacks['metrics']) {
              this.callbacks['metrics']({ data: JSON.stringify(mockData) });
            }
          }, 50);
          
          // 2. Simulate connection error later to trigger Offline badge
          setTimeout(() => {
            this.onerror?.(new Event('error'));
          }, 500);
        }
        addEventListener(event: string, cb: any) {
          this.callbacks[event] = cb;
        }
        removeEventListener() {}
        close() {}
      };
    }, mockMetrics);

    await page.goto('/');

    // Wait for the badge to show "Offline" after the initial "Connected" state
    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toContainText('Offline', { ignoreCase: true, timeout: 5000 });
  });
});
