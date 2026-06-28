# Device Management Backend

API server thu thập và phát luồng metrics hệ thống theo thời gian thực qua SSE.

## Công nghệ

- **Node.js 20** + Express.js 5
- **`systeminformation`** — đọc CPU, RAM, Disk, Network từ hệ thống
- **SSE (Server-Sent Events)** — stream dữ liệu tới frontend liên tục
- **Jest** + Supertest — Unit & Integration Testing

## Chạy từ monorepo root

```bash
# Development (với nodemon — tự reload khi thay đổi code)
npm run dev:backend

# Production
npm run start --workspace=backend
```

Server chạy tại: http://localhost:3001  
SSE endpoint: `GET http://localhost:3001/api/system-metrics`

## Biến môi trường

| Biến | Mặc định | Mô tả |
|---|---|---|
| `PORT` | `3001` | Port server lắng nghe |
| `NODE_ENV` | `development` | Chế độ chạy (`production` / `development`) |
| `SYSTEM_METRICS_STREAM_INTERVAL_MS` | `2000` | Chu kỳ push metrics (ms) |
| `SSE_HEARTBEAT_INTERVAL_MS` | `15000` | Chu kỳ heartbeat giữ kết nối (ms) |
| `SYSTEM_METRICS_LIGHT_CACHE_TTL_MS` | `1000` | TTL cache dữ liệu nhẹ (CPU/RAM) |
| `SYSTEM_METRICS_HEAVY_CACHE_TTL_MS` | `30000` | TTL cache dữ liệu nặng (Disk/Network/OS) |

## Kiểm thử (Testing)

Backend sử dụng **Jest** cho Unit Tests và **Supertest** cho Integration Tests (kiểm tra trực tiếp HTTP endpoints).

```bash
# Chạy toàn bộ tests (Unit + Integration)
npm run test --workspace=backend

# Chỉ chạy Unit Tests
npm run test:unit --workspace=backend

# Chỉ chạy Integration Tests
npm run test:integration --workspace=backend
```

## Docker

### Local (build từ source)
```bash
docker compose up --build backend
```

### Production (pull image từ GHCR)
Image được build tự động bởi GitHub Actions.
Deploy trên EC2 bằng `docker-compose.prod.yml`:
```
ghcr.io/nguyenhai2003/device-management-backend:latest
```

> **Lưu ý:** Docker image backend chỉ cài **production dependencies** (`--omit=dev`) để giảm kích thước image.
