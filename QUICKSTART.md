# InventraERP - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or pnpm installed

## 🚀 Quick Start (Development)

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```powershell
cd backend
npm install
npx prisma generate
npm run dev
```
Backend will run on http://localhost:3001

**Terminal 2 - Frontend:**
```powershell
npm install
npm run dev
```
Frontend will run on http://localhost:3000

### Option 2: Use the Start Script

**Windows (PowerShell):**
```powershell
.\start-dev.ps1
```

This will open two terminals automatically.

## 📝 First Time Setup

1. **Clone and Install:**
```powershell
git clone <your-repo>
cd inventra-ui-starter-v1.7
npm install
cd backend
npm install
cd ..
```

2. **Setup Database:**
```powershell
cd backend
npx prisma generate
npx prisma db push
cd ..
```

3. **Configure Environment Variables:**

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:../prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
```

Create `.env.local` (root):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
DATABASE_URL="file:./prisma/dev.db"
```

4. **Start Development:**
```powershell
# Terminal 1
cd backend && npm run dev

# Terminal 2 (new terminal)
npm run dev
```

## 🔗 Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/health

## 🧪 Testing the Connection

1. Open http://localhost:3000
2. Navigate to any page (inventory, orders, etc.)
3. Open browser DevTools > Network tab
4. You should see API calls to `http://localhost:3001/api/*`

## 📚 API Documentation

See [INTEGRATION.md](./INTEGRATION.md) for complete API service documentation and usage examples.

## 🛠️ Common Commands

### Frontend
```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Backend
```powershell
npm run dev          # Start with nodemon (auto-reload)
npm run build        # Compile TypeScript
npm run start        # Start production server
npx prisma generate  # Generate Prisma client
npx prisma studio    # Open Prisma Studio (GUI)
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify `.env` file exists in backend folder
- Run `npx prisma generate` in backend folder

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check browser console for CORS errors

### Database errors
- Run `npx prisma generate` in backend folder
- Delete `prisma/dev.db` and run `npx prisma db push`

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` settings

## 📦 Production Build

```powershell
# Backend
cd backend
npm run build
npm run start

# Frontend
npm run build
npm run start
```

## 🔐 Default Credentials (Development)

Currently using mock authentication. Any credentials will work until you implement real auth in the backend.

Example:
- Email: any@email.com
- Password: anypassword
- Store ID: anystore

## 🌟 Next Steps

1. ✅ Backend and Frontend connected
2. ✅ API services created
3. ✅ Authentication context set up
4. ✅ Example components provided

**What to do next:**
- Implement real authentication in backend
- Add database models and migrations
- Create forms for data entry
- Add data validation
- Implement error handling
- Add loading states
- Create more UI components

## 📖 Documentation

- [Integration Guide](./INTEGRATION.md) - Complete API documentation
- [Backend Setup](./backend/SETUP.md) - Backend configuration
- [Backend Overview](./backend/OVERVIEW.md) - Architecture details

## 💡 Tips

1. Keep both terminals open while developing
2. Backend auto-reloads on file changes (nodemon)
3. Frontend auto-reloads on file changes (Next.js)
4. Use browser DevTools Network tab to debug API calls
5. Check terminal output for errors

## 🎉 You're Ready!

Both frontend and backend are now connected and ready for development!
