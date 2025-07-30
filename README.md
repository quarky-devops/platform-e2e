# QuarkFin Platform E2E

Modern SaaS platform with Next.js frontend and Go backend.

## Project Structure

```
platform-e2e/
├── frontend/              # Next.js 14 frontend application
├── go_backend/           # Go backend API server
├── build.sh              # Build script for Render
├── start.sh              # Start script for Render
└── render.yaml           # Render deployment configuration
```

## Quick Start

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Access at: http://localhost:3000

### Backend (Go)
```bash
cd go_backend
go run cmd/server/main.go
```
Access at: http://localhost:8080

## Deployment on Render

This project is configured for automatic deployment on Render.

### Method 1: Using render.yaml (Blueprint) - RECOMMENDED
1. Push code to Bitbucket
2. In Render: New > Blueprint
3. Connect your repository
4. Render will use render.yaml automatically

### Method 2: Manual Service Setup
If you created services manually, ensure:
- Build Command: `bash build.sh`
- Start Command: `bash start.sh`

### Troubleshooting Deployment

If build fails with "build.sh not found":
1. Run: `chmod +x fix_render_deployment.sh && ./fix_render_deployment.sh`
2. This will fix everything and push to git
3. Clear cache and redeploy on Render

## Technologies

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI
- React Query
- Zustand

### Backend
- Go
- Echo Framework
- REST API
- WebSocket support

## Scripts

- `build.sh` - Builds the frontend for production
- `start.sh` - Starts the frontend in production
- `fix_render_deployment.sh` - Fixes any deployment issues

## License

Copyright © 2025 QuarkFin. All rights reserved.
# Trigger pipeline - Wed Jul 30 11:39:27 IST 2025
