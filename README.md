# Device Management — Monorepo

Hệ thống giám sát thiết bị theo thời gian thực, bao gồm backend API và frontend dashboard, quản lý bằng **npm workspaces**.

## Cấu trúc dự án

```
device-management/
├── backend/          # Express.js API — SSE system metrics
├── frontend/         # Next.js Dashboard — hiển thị metrics real-time
├── e2e-tests/        # Playwright E2E tests
├── docker-compose.yml
├── package.json      # Workspace root
└── .github/
    └── workflows/
        └── playwright.yml  # CI
```

## Yêu cầu môi trường

- Node.js v20+
- npm v10+
- Docker & Docker Compose (để deploy production)

## Phát triển cục bộ (Development)

```bash
# Cài đặt tất cả dependencies từ root
npm install

# Chạy backend (port 3001) và frontend (port 3000) đồng thời
npm run dev:backend   # terminal 1
npm run dev:frontend  # terminal 2
```

Truy cập Dashboard tại: http://localhost:3000

## Deploy Production (Docker)

```bash
# Build và chạy toàn bộ stack
docker compose up --build -d

# Xem logs
docker compose logs -f

# Dừng
docker compose down
```

| Service  | Port | URL |
|---|---|---|
| Backend  | 3001 | http://localhost:3001 |
| Frontend | 3000 | http://localhost:3000 |

## Kiểm thử (Testing)

Dự án được bao phủ bởi Unit, Integration và E2E tests. Các framework được sử dụng:
- **Backend**: Jest, Supertest (Unit & Integration)
- **Frontend**: Vitest, React Testing Library, jsdom (Unit)
- **E2E**: Playwright

```bash
# Chạy toàn bộ Unit Tests (Backend + Frontend)
npm run test:unit

# Chạy Unit & Integration Tests cho Backend
npm run test:unit:backend

# Chạy Unit Tests cho Frontend
npm run test:unit:frontend

# Chạy E2E Tests (Tự động khởi chạy cả Backend & Frontend)
npm run test:e2e

# Chạy toàn bộ test suites (Unit + E2E)
npm run test
```

## Scripts gốc

| Script | Mô tả |
|---|---|
| `npm run dev:backend` | Chạy backend với nodemon |
| `npm run dev:frontend` | Chạy frontend Next.js dev server |
| `npm run test:e2e` | Chạy Playwright E2E tests |
