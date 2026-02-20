# Coryphaeus Media Bot — Windows VM Setup Script
# Run this in PowerShell (as Administrator) after RDP-ing into cory-media-vm
# VM: 20.83.101.212 | User: coryadmin | Pass: Coryph@eus2026!Vm

$ErrorActionPreference = "Stop"
Write-Host "=== Coryphaeus Media Bot — VM Setup ===" -ForegroundColor Cyan

# ── Step 1: Install .NET 6 SDK ──────────────────────────────────────
Write-Host "`n[1/6] Installing .NET 6 SDK..." -ForegroundColor Yellow
$dotnetInstaller = "$env:TEMP\dotnet-sdk-6.0.428-win-x64.exe"
if (-not (Test-Path $dotnetInstaller)) {
    Invoke-WebRequest -Uri "https://download.visualstudio.microsoft.com/download/pr/0c82e7e6-fdde-49f5-9006-a4df69c0519b/4aa26c0a4aa46cca69463e62ca9f2b1c/dotnet-sdk-6.0.428-win-x64.exe" -OutFile $dotnetInstaller
}
Start-Process -FilePath $dotnetInstaller -ArgumentList "/install", "/quiet", "/norestart" -Wait
$env:PATH += ";C:\Program Files\dotnet"
Write-Host "  .NET SDK installed: $(dotnet --version)" -ForegroundColor Green

# ── Step 2: Install Git ─────────────────────────────────────────────
Write-Host "`n[2/6] Installing Git..." -ForegroundColor Yellow
$gitInstaller = "$env:TEMP\Git-2.43.0-64-bit.exe"
if (-not (Test-Path $gitInstaller)) {
    Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile $gitInstaller
}
Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART" -Wait
$env:PATH += ";C:\Program Files\Git\bin"
Write-Host "  Git installed" -ForegroundColor Green

# ── Step 3: Create self-signed SSL certificate ──────────────────────
Write-Host "`n[3/6] Creating SSL certificate..." -ForegroundColor Yellow
$dnsName = "coryphaeus-media.westus2.cloudapp.azure.com"
$cert = Get-ChildItem -Path Cert:\LocalMachine\My | Where-Object { $_.Subject -like "*$dnsName*" }
if (-not $cert) {
    $cert = New-SelfSignedCertificate `
        -DnsName $dnsName `
        -CertStoreLocation "Cert:\LocalMachine\My" `
        -NotAfter (Get-Date).AddYears(2) `
        -KeySpec KeyExchange `
        -KeyLength 2048
    Write-Host "  Certificate created: $($cert.Thumbprint)" -ForegroundColor Green
} else {
    Write-Host "  Certificate already exists: $($cert.Thumbprint)" -ForegroundColor Green
}
$thumbprint = $cert.Thumbprint

# Grant Network Service access to the certificate private key
$keyPath = "C:\ProgramData\Microsoft\Crypto\RSA\MachineKeys"
$keyName = (($cert.PrivateKey).CspKeyContainerInfo).UniqueKeyContainerName
if ($keyName) {
    $keyFullPath = Join-Path $keyPath $keyName
    if (Test-Path $keyFullPath) {
        $acl = Get-Acl $keyFullPath
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule("NETWORK SERVICE", "Read", "Allow")
        $acl.AddAccessRule($rule)
        Set-Acl $keyFullPath $acl
        Write-Host "  Granted NETWORK SERVICE access to private key" -ForegroundColor Green
    }
}

# ── Step 4: Clone the repo ──────────────────────────────────────────
Write-Host "`n[4/6] Cloning repository..." -ForegroundColor Yellow
$repoDir = "C:\coryphaeus"
if (-not (Test-Path $repoDir)) {
    git clone https://github.com/sanjugos/coryphaeus-spec-reviewer.git $repoDir
    Set-Location "$repoDir\media-bot\src\CoryphaeusMediaBot"
    git checkout feature/teams-participant
} else {
    Set-Location "$repoDir\media-bot\src\CoryphaeusMediaBot"
    git pull
}
Write-Host "  Repository cloned to $repoDir" -ForegroundColor Green

# ── Step 5: Create .env file ────────────────────────────────────────
Write-Host "`n[5/6] Writing .env configuration..." -ForegroundColor Yellow
$envContent = @"
BOT_APP_ID=99fdef1f-0dd2-4822-8368-00c0ef33bdb3
BOT_APP_SECRET=<SET_FROM_AZURE_PORTAL>
BOT_TENANT_ID=e5705bc7-6323-414d-9e55-d16476a66ad6
SERVICE_DNS_NAME=$dnsName
CERTIFICATE_THUMBPRINT=$thumbprint
INSTANCE_PUBLIC_PORT=8445
INSTANCE_INTERNAL_PORT=8445
MEDIA_INSTANCE_PUBLIC_PORT=20000
MEDIA_INSTANCE_INTERNAL_PORT=20000
AZURE_SPEECH_KEY=<SET_FROM_AZURE_PORTAL>
AZURE_SPEECH_REGION=westus2
NODE_BACKEND_WS_URL=wss://coryphaeus-teams-agent.azurewebsites.net/ws/media
"@
$envContent | Out-File -FilePath "$repoDir\media-bot\src\CoryphaeusMediaBot\.env" -Encoding UTF8
Write-Host "  .env created" -ForegroundColor Green

# ── Step 6: Open firewall ports ─────────────────────────────────────
Write-Host "`n[6/6] Configuring Windows Firewall..." -ForegroundColor Yellow
$ports = @(
    @{Name="MediaBot-Signaling"; Port=8445},
    @{Name="MediaBot-Media"; Port=20000},
    @{Name="MediaBot-Kestrel"; Port=9441}
)
foreach ($p in $ports) {
    $existing = Get-NetFirewallRule -DisplayName $p.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $p.Name -Direction Inbound -Protocol TCP -LocalPort $p.Port -Action Allow | Out-Null
        Write-Host "  Firewall rule added: $($p.Name) (port $($p.Port))" -ForegroundColor Green
    } else {
        Write-Host "  Firewall rule exists: $($p.Name) (port $($p.Port))" -ForegroundColor Green
    }
}

# ── Summary ─────────────────────────────────────────────────────────
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Certificate Thumbprint: $thumbprint"
Write-Host "  DNS Name:               $dnsName"
Write-Host "  Project Path:           $repoDir\media-bot\src\CoryphaeusMediaBot"
Write-Host ""
Write-Host "  To build and run:" -ForegroundColor Yellow
Write-Host "    cd $repoDir\media-bot\src\CoryphaeusMediaBot"
Write-Host "    dotnet restore"
Write-Host "    dotnet run"
Write-Host ""
Write-Host "  The media bot will start on https://0.0.0.0:9441"
Write-Host "  It will connect to the Node.js backend via WebSocket at:"
Write-Host "    wss://coryphaeus-teams-agent.azurewebsites.net/ws/media"
Write-Host ""
