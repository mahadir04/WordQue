# EduRAG — Start both backend and frontend
Write-Host "`n🚀 Starting EduRAG..." -ForegroundColor Cyan

# Start backend
Write-Host "`n📦 Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; pip install -r requirements.txt -q; uvicorn main:app --reload --port 8000" -PassThru

Start-Sleep -Seconds 3

# Start frontend
Write-Host "🎨 Starting Frontend (Vite)..." -ForegroundColor Green
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -PassThru

Write-Host "`n✅ EduRAG is running!" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "`nPress any key to stop both servers..." -ForegroundColor DarkGray

$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
Write-Host "`n🛑 Servers stopped." -ForegroundColor Red
