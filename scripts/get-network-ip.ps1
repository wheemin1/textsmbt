# Get network IP address for development access
$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" 
}

Write-Host "=== Network Access URLs for Development ==="
Write-Host ""

foreach ($adapter in $networkAdapters) {
    $interfaceName = $adapter.InterfaceAlias
    $ipAddress = $adapter.IPAddress
    
    Write-Host "Interface: $interfaceName"
    Write-Host "IP: $ipAddress"
    Write-Host "URL: http://$ipAddress:3000"
    Write-Host "---"
}

Write-Host ""
Write-Host "Usage Instructions:"
Write-Host "1. Run 'npm run dev' to start the development server"
Write-Host "2. Use any of the above URLs from other devices"
Write-Host "3. Ensure Windows Firewall allows Node.js connections"
Write-Host "4. Other devices must be on the same network"
