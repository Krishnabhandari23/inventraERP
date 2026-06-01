# 🚀 InventraERP - Deployment Setup Complete

## ✅ What's Been Configured

Your frontend and backend are now set up for **single-service deployment** on Render.

### Files Created:

1. **server.js** - Combined Node.js server that:
   - Serves the Next.js frontend on `/`
   - Routes `/api/*` calls to the backend
   - Serves static files

2. **Procfile** - Tells Render how to run your application
   ```
   web: npm run start:prod
   ```

3. **render.yaml** - Infrastructure configuration (optional)

4. **DEPLOYMENT.md** - Complete deployment guide

5. **.env.production** - Production environment template

6. **Updated package.json** with scripts:
   - `npm run dev:combined` - Local development (combined)
   - `npm run dev` - Development (separate frontend & backend)
   - `npm run build:all` - Build both frontend and backend
   - `npm run start` - Production start command

## 🎯 To Deploy on Render

### Step 1: Go to Render Dashboard
Visit https://dashboard.render.com and click "New +" → "Web Service"

### Step 2: Connect Repository
Select your GitHub repository (Krishnabhandari23/inventraERP)

### Step 3: Configure
- **Name**: `inventra-erp-app`
- **Runtime**: `Node`
- **Build Command**: `npm run build:all`
- **Start Command**: `npm run start`

### Step 4: Set Environment Variables
In Render dashboard, add:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-postgres-url>
CORS_ORIGIN=https://your-render-url.onrender.com
BACKEND_URL=https://your-render-url.onrender.com
```

### Step 5: Connect Database (Optional)
Create a PostgreSQL database on Render and link it

### Step 6: Deploy
Click "Create Web Service" and Render will automatically deploy!

## 🧪 Local Testing

Test the production build locally:
```bash
npm run build:all
npm run start
```
Then open http://localhost:3000

## 📦 Project Structure

```
.
├── server.js              ← Combined server (serves both frontend & API)
├── app/                   ← Next.js frontend
├── backend/               ← Express backend API
├── components/            ← React components
├── Procfile               ← Deployment config
├── package.json           ← Root dependencies
└── DEPLOYMENT.md          ← Full deployment guide
```

## 🔑 Key Features

✅ Single deployable service  
✅ Automatic build process  
✅ Both frontend & backend on same URL  
✅ API proxying (/api/* → backend)  
✅ Static file serving  
✅ Environment-based configuration  

## 📝 Next Steps

1. Push any changes to GitHub
2. Go to Render and connect your repository
3. Follow the deployment steps above
4. Render will automatically deploy on every push to `main`

## 🆘 Troubleshooting

**APIs not working?**
- Check `BACKEND_URL` environment variable
- Verify backend builds successfully
- Check Render logs for errors

**Frontend not loading?**
- Ensure `npm run build` succeeds locally
- Check `.next/` directory exists
- Verify `CORS_ORIGIN` is set correctly

## 📚 Documentation

See **DEPLOYMENT.md** for detailed troubleshooting and scaling options.

---

Your project is ready to deploy! 🎉
