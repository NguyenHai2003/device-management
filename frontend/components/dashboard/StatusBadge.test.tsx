import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

describe("StatusBadge", () => {
  test("renders 'Online' when status is online", () => {
    render(<StatusBadge status="online" testId="badge" />);
    expect(screen.getByTestId("badge")).toHaveTextContent(/online/i);
  });

  test("renders 'Offline' when status is offline", () => {
    render(<StatusBadge status="offline" testId="badge" />);
    expect(screen.getByTestId("badge")).toHaveTextContent(/offline/i);
  });
});
