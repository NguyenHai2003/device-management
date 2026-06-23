# Device Management E2E Tests (Playwright)

Thư mục này chứa các kịch bản kiểm thử End-to-End (E2E) tự động bằng **Playwright** cho toàn bộ hệ thống Device Management.

## Tính năng kiểm thử

- **Frontend Dashboard (UI Testing)**: Mô phỏng trình duyệt để kiểm tra việc render UI, Data Mapping từ SSE, trạng thái Offline, xử lý dữ liệu Null (trên Windows) và Visual Regression (ảnh chụp màn hình).
- **Backend SSE API (Integration Testing)**: Kiểm tra trực tiếp endpoint `/api/system-metrics`, xác nhận các headers đúng chuẩn Server-Sent Events và định dạng payload dữ liệu trả về.
- **Tự động khởi chạy Monorepo**: Trong quá trình chạy test, Playwright được cấu hình (`playwright.config.ts`) để tự động `npm run dev` cả Backend (port 3001) và Frontend (port 3000) song song trước khi chạy kịch bản.

## Chạy từ Root (Khuyên dùng)

Do thiết lập Monorepo (npm workspaces), các lệnh cài đặt và chạy test nên được thực thi từ **thư mục root** của dự án:

```bash
# Chạy toàn bộ E2E tests (không giao diện / headless)
npm run test:e2e

# Chạy E2E tests với giao diện UI Runner của Playwright
npm run test:e2e -- --ui

# Xem báo cáo HTML sau khi test
npm run test:e2e -- --show-report
```

## Chạy cục bộ trong thư mục này

Nếu bạn đang ở trong thư mục `e2e-tests/`:

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
├── playwright.config.ts             # Cấu hình Playwright (tích hợp webServer cho Backend & Frontend)
└── package.json
```
