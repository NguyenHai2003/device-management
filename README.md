# Device Management — Monorepo

Hệ thống giám sát thiết bị theo thời gian thực, bao gồm backend API và frontend dashboard, quản lý bằng **npm workspaces**.

[![CI/CD Pipeline](https://github.com/NguyenHai2003/device-management/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/NguyenHai2003/device-management/actions/workflows/ci-cd.yml)

## Cấu trúc dự án

```
device-management/
├── backend/               # Express.js API — SSE system metrics
├── frontend/              # Next.js Dashboard — hiển thị metrics real-time
├── e2e-tests/             # Playwright E2E tests
├── docker-compose.yml     # Dùng để chạy local (build từ source)
├── docker-compose.prod.yml # Dùng để deploy production (pull image từ GHCR)
├── package.json           # Workspace root
└── .github/
    └── workflows/
        └── ci-cd.yml      # CI/CD Pipeline (Test → Build → Deploy)
```

## Yêu cầu môi trường

- Node.js v20+
- npm v10+
- Docker & Docker Compose (để deploy production)

## Phát triển cục bộ (Development)

```bash
# Cài đặt tất cả dependencies từ root
npm install

# Chạy backend (port 3001) và frontend (port 3000)
npm run dev:backend
npm run dev:frontend 
```

Tạo file `frontend/.env.local` với nội dung:
```env
NEXT_PUBLIC_METRICS_SSE_URL=http://localhost:3001/api/system-metrics
```

Truy cập Dashboard tại: http://localhost:3000

## Deploy Local bằng Docker (Môi trường Production)

Dùng `docker-compose.yml` để build image từ mã nguồn và chạy toàn bộ stack ngay trên máy.

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

## CI/CD Pipeline (GitHub Actions → AWS EC2)

Dự án sử dụng GitHub Actions để tự động hóa toàn bộ quy trình từ code đến production.

```
[Push to main] → 🧪 Test (E2E Playwright) → 🐳 Build & Push Image (GHCR) → 🚀 Deploy (AWS EC2)
[Pull Request] → 🧪 Test (E2E Playwright)   (không build/deploy)
```

**Công nghệ sử dụng:**
- **Container Registry:** GitHub Container Registry (GHCR)
- **Máy chủ:** AWS EC2 t2.micro (Ubuntu 24.04 LTS — Free Tier)
- **Orchestration:** Docker Compose (`docker-compose.prod.yml`)

**GitHub Secrets cần cấu hình:**

| Secret | Mô tả |
|---|---|
| `EC2_HOST` | Public IPv4 của máy chủ EC2 |
| `EC2_USERNAME` | Tên user SSH (mặc định: `ubuntu`) |
| `EC2_SSH_KEY` | Nội dung toàn bộ file `.pem` |
| `GH_PAT_TOKEN` | GitHub Personal Access Token (scope: `write:packages`) |

## Kiểm thử (Testing)

Dự án được bao phủ bởi Unit, Integration và E2E tests.

| Loại test | Workspace | Framework |
|---|---|---|
| Unit & Integration | `backend` | Jest, Supertest |
| Unit | `frontend` | Vitest, React Testing Library |
| E2E | `e2e-tests` | Playwright |

```bash
# Chạy toàn bộ Unit Tests (Backend + Frontend)
npm run test:unit

# Chạy Unit Tests cho Backend
npm run test:unit:backend

# Chạy Unit Tests cho Frontend
npm run test:unit:frontend

# Chạy E2E Tests (Playwright tự khởi động Backend & Frontend)
npm run test:e2e

# Chạy toàn bộ test suites (Unit + E2E)
npm run test
```

## Scripts gốc

| Script | Mô tả |
|---|---|
| `npm run dev:backend` | Chạy backend với nodemon (hot-reload) |
| `npm run dev:frontend` | Chạy frontend Next.js dev server |
| `npm run test:unit` | Chạy Unit Tests toàn bộ workspace |
| `npm run test:e2e` | Chạy Playwright E2E tests |
| `npm run test` | Chạy toàn bộ Unit + E2E tests |
