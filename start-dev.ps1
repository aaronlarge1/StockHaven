# Stock Haven — starts API server + React client in two terminal windows
Write-Host "Starting Stock Haven dev environment..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "C:\Users\aaron\dev\StockHaven\server"; Write-Host "API Server starting..." -ForegroundColor Green; npm run dev'
Start-Sleep 2
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'Set-Location "C:\Users\aaron\dev\StockHaven\client"; Write-Host "React client starting..." -ForegroundColor Green; npm run dev'

Write-Host ""
Write-Host "Both servers are starting in new windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API:      http://localhost:5000/api/health" -ForegroundColor Yellow
