import { render, screen } from "@testing-library/react";
import { SystemMetrics } from "@/components/dashboard/SystemMetrics";

// Recharts uses ResizeObserver internally — mock it for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const baseProps = {
  cpuUsage: 45,
  cpuBreakdown: { user: 30, system: 15 },
  ramUsage: { total: "16 GB", used: "8 GB", available: "8 GB", free: "7 GB" },
  ramUsagePercent: 50,
  networkUsage: { up: "100 B/s", down: "200 B/s", txTotal: "5 KB", rxTotal: "10 KB" },
  loadAverage: 1.5,
  loadCurrentLoad: 45,
  cpuHistory: Array(8).fill(0),
  networkHistory: Array(8).fill(0),
  testId: "metrics",
};

describe("SystemMetrics", () => {
  test("renders CPU usage percentage", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  test("renders RAM used / total", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.getByText(/8 GB.*16 GB/)).toBeInTheDocument();
  });

  test("renders loadAverage as formatted number when not null", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.getByTestId("load-average")).toHaveTextContent("1.50");
  });

  test("renders 'N/A' when loadAverage is null (Windows)", () => {
    render(<SystemMetrics {...baseProps} loadAverage={null} />);
    expect(screen.getByTestId("load-average")).toHaveTextContent("N/A");
  });

  test("shows Windows note when loadAverage is null", () => {
    render(<SystemMetrics {...baseProps} loadAverage={null} />);
    expect(screen.getByText(/not available on Windows/i)).toBeInTheDocument();
  });

  test("does NOT show Windows note when loadAverage is a number", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.queryByText(/not available on Windows/i)).not.toBeInTheDocument();
  });

  test("renders network up/down speeds", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.getByText(/100 B\/s/)).toBeInTheDocument();
    expect(screen.getByText(/200 B\/s/)).toBeInTheDocument();
  });

  test("renders CPU breakdown user/system", () => {
    render(<SystemMetrics {...baseProps} />);
    expect(screen.getByText(/User:.*30\.00%/)).toBeInTheDocument();
  });
});
