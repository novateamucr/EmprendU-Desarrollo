# EmprendU Frontend - Local Development Setup

## Prerequisites
- Node.js 18+
- npm or yarn

## Setup Steps

1. **Create environment file:**
   Create `.env` in the project root with:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   VITE_USE_MSW=false
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at: http://127.0.0.1:3000

## Testing Real API Connection

1. **Navigate to profile pages:**
   - `/perfil` - Should load real user data
   - `/perfil/editar` - Should allow editing profile with real API calls

2. **Expected behavior:**
   - Data loads from Laravel API (not mocks)
   - Form submissions send real HTTP requests
   - If backend is down, shows handled errors (no white screen)

## API Configuration
- **Base URL:** `http://127.0.0.1:8000/api`
- **Proxy:** Vite proxies `/api` requests to avoid CORS issues
- **MSW:** Completely disabled when `VITE_USE_MSW=false`

## Health Check
Run the API health check:
```bash
npm run check:api
```

## Notes
- The `.env` file is gitignored and should not be committed
- MSW (Mock Service Worker) is disabled for real API connections
- Vite proxy handles CORS in development
- Backend must be running on `http://127.0.0.1:8000` for API calls to work
