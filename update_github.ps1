Write-Host "Staging changes..." -ForegroundColor Cyan
git add .
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "Update SEMSYSTEM: attendance scanning, gate monitor UI, backend API, and type fixes"
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main
Write-Host "Done pushing to GitHub!" -ForegroundColor Green
