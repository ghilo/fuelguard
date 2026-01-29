# FuelGuard Deployment Guide

## Railway Deployment (Recommended)

### Prerequisites
- GitHub account with your code pushed
- Railway account (https://railway.app)

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `fuelguard` repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically create the database

### Step 3: Deploy Backend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo and set the **Root Directory** to `packages/backend`
3. Railway will detect the Dockerfile automatically

**Add Environment Variables:**
Click on the backend service → **Variables** tab → Add these:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=<generate-a-secure-random-string>
JWT_REFRESH_SECRET=<generate-another-secure-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
QR_SECRET=<generate-another-secure-random-string>
FRONTEND_URL=<your-frontend-url>
```

> Tip: Use `openssl rand -base64 32` to generate secure secrets

### Step 4: Deploy Frontend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repo and set the **Root Directory** to `packages/frontend`
3. Railway will detect the Dockerfile automatically

**Add Environment Variables:**
```
VITE_API_URL=<your-backend-url>/api
```

### Step 5: Generate Domains

1. Click on each service → **Settings** → **Networking**
2. Click **"Generate Domain"** for both backend and frontend
3. Update the environment variables with the generated URLs

### Step 6: Run Database Migrations

In the backend service, go to **Settings** → **Deploy** and the migrations will run automatically on deploy (configured in Dockerfile).

To seed the database, you can run:
```bash
railway run npx prisma db seed
```

---

## Environment Variables Reference

### Backend (`packages/backend`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random 32+ char string |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `QR_SECRET` | Secret for QR code signing | Random 32+ char string |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.up.railway.app` |

### Frontend (`packages/frontend`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-api.up.railway.app/api` |

---

## Local Docker Testing

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

Access:
- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database: localhost:5432

---

## Alternative: Manual VPS Deployment

### Requirements
- Ubuntu 22.04+ server
- Docker & Docker Compose installed
- Domain name (optional but recommended)

### Steps

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/fuelguard.git
cd fuelguard
```

2. **Create environment file:**
```bash
cp .env.example .env
# Edit .env with your production values
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Set up reverse proxy (nginx):**
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

5. **Configure SSL (Let's Encrypt):**
```bash
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

### Database connection issues
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check network connectivity

### CORS errors
- Verify `FRONTEND_URL` matches your frontend domain
- Include protocol (https://)

### Build failures
- Check Docker logs: `docker-compose logs backend`
- Ensure all dependencies are in package.json

---

## Test Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fuelguard.dz | admin123 |
| Manager | manager@fuelguard.dz | manager123 |
| Citizen | citizen@test.dz | citizen123 |
