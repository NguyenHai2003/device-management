# Device Management E2E Tests (Playwright)

Thư mục này chứa các kịch bản kiểm thử End-to-End (E2E) tự động bằng **Playwright** cho toàn bộ hệ thống Device Management.

## Tính năng kiểm thử

- **Frontend Dashboard (UI Testing):** Mô phỏng trình duyệt để kiểm tra render UI, data mapping từ SSE, trạng thái offline, xử lý dữ liệu null (trên Windows) và visual regression (ảnh chụp màn hình).
- **Backend SSE API (Integration Testing):** Kiểm tra trực tiếp endpoint `GET /api/system-metrics`, xác nhận headers đúng chuẩn Server-Sent Events và định dạng payload dữ liệu trả về.
- **Tự động khởi chạy Monorepo:** `playwright.config.ts` được cấu hình để tự động chạy `npm run dev` cho cả Backend (port 3001) và Frontend (port 3000) song song trước khi thực thi bất kỳ kịch bản nào.

## Chạy từ Root (Khuyên dùng)

Do thiết lập Monorepo (npm workspaces), các lệnh nên được thực thi từ **thư mục root** của dự án:

```bash
# Chạy toàn bộ E2E tests (không giao diện / headless)
npm run test:e2e

# Chạy E2E tests với giao diện UI Runner của Playwright
npm run test:e2e -- --ui

# Xem báo cáo HTML sau khi test
npm run test:e2e -- --show-report
```

## Chạy cục bộ trong thư mục này

```bash
npx playwright test
npx playwright test --ui
npx playwright show-report
```

## Cấu trúc thư mục

```
e2e-tests/
├── tests/
│   ├── backend-sse.spec.ts          # Test HTTP cho Backend SSE stream
│   └── frontend-dashboard.spec.ts   # Test UI cho Frontend Dashboard
├── playwright.config.ts             # Cấu hình (webServer tự khởi Backend & Frontend)
└── package.json
```

## Tích hợp CI/CD

Các E2E tests được chạy tự động trong **Job 1 (`🧪 Test`)** của GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) mỗi khi có:
- `push` lên nhánh `main` / `master`
- `pull_request` vào nhánh `main` / `master`

Playwright report được upload lên GitHub Actions Artifacts và lưu trong **30 ngày** để dễ dàng debug khi test thất bại.
