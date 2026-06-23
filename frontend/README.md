# Device Management Frontend

Dashboard giám sát thiết bị theo thời gian thực, kết nối SSE với backend.

## Công nghệ

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix UI)
- Recharts — biểu đồ metrics

## Chạy từ monorepo root

```bash
# Development
npm run dev:frontend

# Build production
npm run build --workspace=frontend
```

Dashboard tại: http://localhost:3000

## Biến môi trường

Tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_METRICS_SSE_URL=http://localhost:3001/api/system-metrics
```

## Kiểm thử (Testing)

Frontend sử dụng **Vitest** kết hợp với **React Testing Library** và **jsdom** để chạy Unit Tests cho UI Components và hooks.

```bash
# Chạy Unit Tests
npm run test --workspace=frontend

# Chạy Unit Tests ở chế độ Watch (Development)
npm run test:watch --workspace=frontend
```

## Docker (từ root)

```bash
docker compose up --build frontend
```

> **Lưu ý:** Frontend Docker image dùng **Next.js standalone mode** — không cần nginx. 
> Server chạy trực tiếp bằng `node server.js` trên port 3000.
