# Start InventraERP Development Servers
# This script starts both the backend and frontend servers in separate windows

Write-Host "🚀 Starting InventraERP Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if backend directory exists
if (-not (Test-Path ".\backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path ".\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path ".\backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

# Generate Prisma client if needed
Write-Host "🔧 Checking Prisma client..." -ForegroundColor Yellow
Set-Location backend
npx prisma generate | Out-Null
Set-Location ..

Write-Host ""
Write-Host "✅ Dependencies ready!" -ForegroundColor Green
Write-Host ""

# Start backend in new terminal
Write-Host "🖥️  Starting backend server (http://localhost:3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 Backend Server' -ForegroundColor Green; Write-Host 'Running on http://localhost:3001' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in new terminal
Write-Host "🖥️  Starting frontend server (http://localhost:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '⚡ Frontend Server' -ForegroundColor Green; Write-Host 'Running on http://localhost:3000' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "✨ Development servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "   API:       http://localhost:3001/api" -ForegroundColor White
Write-Host "   Health:    http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Check the newly opened terminal windows for server output" -ForegroundColor Cyan
Write-Host "🛑 To stop: Close the terminal windows or press Ctrl+C in each" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
