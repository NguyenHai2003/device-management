# Device Management Frontend

Dashboard giám sát thiết bị theo thời gian thực, kết nối SSE với backend.

## Công nghệ

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui (Radix UI) — hệ thống UI components
- **Recharts** — biểu đồ metrics real-time
- **Vitest** + React Testing Library — Unit Testing

## Chạy từ monorepo root

```bash
# Development
npm run dev:frontend

# Build production
npm run build --workspace=frontend

# Chạy Unit Tests
npm run test:unit:frontend
```

Dashboard tại: http://localhost:3000

## Biến môi trường

Tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_METRICS_SSE_URL=http://localhost:3001/api/system-metrics
```

> **Lưu ý:** Biến `NEXT_PUBLIC_METRICS_SSE_URL` được nhúng vào lúc **build** (build-time), không phải runtime.
> Trong CI/CD pipeline, giá trị IP của EC2 sẽ được truyền vào lúc `docker build` qua `--build-arg`.

## Kiểm thử (Testing)

Frontend sử dụng **Vitest** kết hợp với **React Testing Library** và **jsdom** để chạy Unit Tests cho UI components và hooks.

```bash
# Chạy Unit Tests
npm run test --workspace=frontend

# Chạy Unit Tests ở chế độ Watch (Development)
npm run test:watch --workspace=frontend
```

## Docker (từ root)

### Local (build từ source)
```bash
docker compose up --build frontend
```

### Production (pull image từ GHCR)
Image được build tự động bởi GitHub Actions và lưu trên GHCR.
Deploy trên EC2 bằng `docker-compose.prod.yml`.

> **Lưu ý kỹ thuật:** Frontend Docker image dùng **Next.js standalone mode** — server chạy trực tiếp bằng `node server.js` trên port 3000, không cần nginx hay thêm web server nào khác.
>
> **Alpine Linux:** Dockerfile cài thêm `@tailwindcss/oxide-linux-x64-musl` để khắc phục lỗi native binary của Tailwind CSS v4 trên Alpine (npm optional-deps bug #4828).
