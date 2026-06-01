# InventraERP - Deployment Guide

## Combined Frontend & Backend Deployment on Render

This project is configured for **single-instance deployment** on Render, combining the Next.js frontend and Express backend into one service.

## Project Structure

```
.
├── app/                 # Next.js frontend pages & components
├── backend/            # Express backend API
├── components/         # Shared React components
├── server.js           # Combined server (Node.js) - serves both frontend & backend
├── next.config.mjs     # Next.js configuration
├── package.json        # Root package.json with combined scripts
└── Procfile           # Deployment configuration for Render
```

## How It Works

1. **Build Phase**: 
   - Builds Next.js frontend to `.next/` directory
   - Builds TypeScript backend to `backend/dist/` directory

2. **Runtime**:
   - The `server.js` file runs on a single Node.js process
   - Serves Next.js frontend on `/` 
   - Routes API calls from `/api/*` to the backend
   - Handles static file serving

## Local Development

### Run both frontend and backend together:
```bash
npm run dev:combined
```

### Or run them separately:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

## Deployment on Render

### Step 1: Connect Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### Step 2: Configure Build Settings
- **Name**: `inventra-erp` (or your preferred name)
- **Runtime**: `Node`
- **Build Command**: `npm run build:all`
- **Start Command**: `npm run start`
- **Environment**: `production`

### Step 3: Set Environment Variables
Add these environment variables in Render dashboard:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-database-connection-string>
CORS_ORIGIN=https://<your-render-url>.onrender.com
BACKEND_URL=https://<your-render-url>.onrender.com
```

### Step 4: Connect Database
1. Create a PostgreSQL database on Render
2. In the web service settings, link the database
3. Use the `DATABASE_URL` from the linked database

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically start deploying
3. Check the deployment logs for any errors

## Production Build

To test the production build locally:

```bash
npm run build:all
npm run start
```

Then open http://localhost:3000

## Troubleshooting

### API Routes Not Working
- Check that `/api/*` routes are properly configured in Express backend
- Verify `BACKEND_URL` environment variable matches your Render URL
- Check backend service logs

### Frontend Not Loading
- Ensure `npm run build` completes successfully
- Check that `.next/` directory is created
- Verify static files are in `public/` directory

### Database Connection Issues
- Confirm `DATABASE_URL` is set correctly
- Check Prisma migrations have run
- Verify database user has proper permissions

## File Structure Explanation

- **server.js**: Main entry point that combines Next.js + Express
  - Serves frontend on `/`
  - Proxies API calls to `/api/*`
  - Handles static file serving

- **next.config.mjs**: Next.js configuration
- **backend/src/server.ts**: Express backend API
- **Procfile**: Tells Render how to start the application
- **render.yaml**: Infrastructure-as-code configuration (optional)

## Scaling Notes

For production with high traffic:

1. **Option 1**: Use separate services for frontend and backend
2. **Option 2**: Upgrade to a paid Render plan for better performance
3. **Option 3**: Use a CDN like Cloudflare in front

## Git Workflow

After deployment is set up:

```bash
git add .
git commit -m "Configure for Render deployment"
git push
```

Render will automatically redeploy when you push to the main branch.

## Support

For issues:
1. Check Render logs in the dashboard
2. Review build and runtime environment variables
3. Verify all dependencies are in package.json
4. Ensure `.gitignore` excludes `node_modules/`, `.next/`, etc.
