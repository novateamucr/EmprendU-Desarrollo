# EmprendU Backend - Local Development Setup

## Prerequisites
- PHP 8.1+
- Composer
- MySQL database (cloud-hosted)

## Setup Steps

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure database credentials:**
   Edit `.env` and replace the following placeholders with your actual database credentials:
   - `__DB_HOST__` → Your database host
   - `__DB_NAME__` → Your database name  
   - `__DB_USER__` → Your database username
   - `__DB_PASS__` → Your database password

3. **Generate application key (if APP_KEY is empty):**
   ```bash
   php artisan key:generate
   ```

4. **Install dependencies:**
   ```bash
   composer install
   ```

5. **Start the development server:**
   ```bash
   php artisan serve
   ```
   
   The API will be available at: http://127.0.0.1:8000

## API Endpoints
- Base URL: `http://127.0.0.1:8000/api`
- Profile endpoints: `/api/profile/*`
- All endpoints are prefixed with `/api`

## Notes
- The `.env` file is gitignored and should not be committed
- Database is hosted in the cloud, no local MySQL setup required
- CORS is handled by the Vite proxy in the frontend
