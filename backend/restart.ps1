# Kill anything on port 5000, then start the backend
$proc = netstat -ano | Select-String ":5000 " | Select-String "LISTENING"
if ($proc) {
    $pid5000 = ($proc -replace '.*\s+(\d+)$','$1').Trim()
    Stop-Process -Id $pid5000 -Force -ErrorAction SilentlyContinue
    Write-Host "Killed PID $pid5000 on port 5000"
    Start-Sleep -Milliseconds 500
}
Start-Process -FilePath "node" -ArgumentList "src/app.js" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
Start-Sleep -Milliseconds 2000
try { $r = Invoke-RestMethod -Uri "http://localhost:5000/api/health"; Write-Host "Backend OK: $($r.status)" }
catch { Write-Host "Backend may still be starting..." }
