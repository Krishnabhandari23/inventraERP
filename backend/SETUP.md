# InventraERP Backend - Setup Guide

## 📋 Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git (optional)

## 🚀 Installation Steps

### Step 1: Navigate to Backend Directory
```powershell
cd g:\InventraERP\inventra-ui-starter-v1.7\backend
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Create Environment File
```powershell
# Copy the example environment file
Copy-Item .env.example .env

# Edit the .env file with your preferred text editor
notepad .env
```

**Important Environment Variables to Configure:**
- `JWT_SECRET` - Change to a random secure string
- `DATABASE_URL` - Points to SQLite by default (for production, use PostgreSQL)
- `CORS_ORIGIN` - Your frontend URL (default: http://localhost:3000)
- `STRIPE_SECRET_KEY` - Your Stripe API key (if using Stripe)

### Step 4: Generate Prisma Client
```powershell
npm run prisma:generate
```

### Step 5: Initialize Database
Since the Prisma schema is in the parent directory, you need to:

```powershell
# Navigate to parent directory
cd ..

# Run Prisma migrations
npx prisma migrate dev --name init

# Go back to backend directory
cd backend
```

### Step 6: Start Development Server
```powershell
npm run dev
```

You should see:
```
🚀 InventraERP Backend running on port 3001
📊 Environment: development
🔗 API URL: http://localhost:3001
```

## ✅ Verify Installation

Test the health endpoint:
```powershell
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-01-22T..."}
```

## 🔧 Common Commands

```powershell
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## 🐛 Troubleshooting

### Port Already in Use
If port 3001 is already in use, change it in `.env`:
```
PORT=3002
```

### Database Connection Error
Make sure the `DATABASE_URL` in `.env` points to the correct location:
```
DATABASE_URL="file:../prisma/dev.db"
```

### Prisma Client Not Generated
Run:
```powershell
npm run prisma:generate
```

### CORS Errors
Update `CORS_ORIGIN` in `.env` to match your frontend URL:
```
CORS_ORIGIN=http://localhost:3000
```

## 📡 Testing the API

### Using PowerShell (Windows)

```powershell
# Test health endpoint
Invoke-RestMethod -Uri http://localhost:3001/health -Method Get

# Test login (mock)
$body = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/auth/login -Method Post -Body $body -ContentType "application/json"
```

### Using curl (if installed)

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 📦 Next Steps

1. **Add Real Data Models** - Update Prisma schema with Inventory, ProductionOrder, etc.
2. **Add Password Field** - Add password field to User model and implement bcrypt
3. **Configure Stripe** - Add real Stripe keys for billing
4. **Set Up Production Database** - Migrate from SQLite to PostgreSQL
5. **Deploy** - Deploy to your hosting provider

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Update `DATABASE_URL` to production database
- [ ] Set `NODE_ENV=production`
- [ ] Configure real Stripe keys
- [ ] Set up HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Review rate limiting settings
- [ ] Add password field to User model
- [ ] Implement password reset flow

## 📚 Documentation

- Full API documentation: See [README.md](README.md)
- Prisma docs: https://www.prisma.io/docs
- Express docs: https://expressjs.com
- JWT docs: https://jwt.io

## 🆘 Need Help?

Check the main README.md for complete API endpoint documentation and examples.
