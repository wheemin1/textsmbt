# FastText Korean Vector Download Script
# Downloads and sets up cc.ko.300.vec for enhanced word similarity

$vectorUrl = "https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz"
$downloadPath = "data/fasttext/cc.ko.300.vec.gz"
$extractedPath = "data/fasttext/cc.ko.300.vec"

Write-Host "🚀 FastText Korean Vector Setup" -ForegroundColor Green
Write-Host "===============================`n"

# Check if already downloaded
if (Test-Path $extractedPath) {
    Write-Host "✅ FastText Korean vectors already available!" -ForegroundColor Green
    Write-Host "   Location: $extractedPath"
    Write-Host "   Restart the server to use FastText vectors.`n"
    exit 0
}

# Create directory if it doesn't exist
$fastTextDir = Split-Path $downloadPath -Parent
if (!(Test-Path $fastTextDir)) {
    New-Item -ItemType Directory -Force -Path $fastTextDir | Out-Null
    Write-Host "📁 Created directory: $fastTextDir"
}

Write-Host "📥 Downloading FastText Korean vectors..."
Write-Host "   Source: $vectorUrl"
Write-Host "   This may take several minutes (~4.7 GB)`n"

try {
    # Download with progress
    Invoke-WebRequest -Uri $vectorUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ Download completed successfully!" -ForegroundColor Green
    
    Write-Host "📦 Extracting vectors..."
    
    # Extract using 7-Zip if available, otherwise use .NET
    $sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
    if ($sevenZip) {
        & 7z x $downloadPath -o"$fastTextDir"
        Write-Host "✅ Extraction completed with 7-Zip!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  7-Zip not found. Please manually extract:" -ForegroundColor Yellow
        Write-Host "   1. Extract $downloadPath"
        Write-Host "   2. Place cc.ko.300.vec in data/fasttext/"
        Write-Host "   3. Restart the server"
        exit 1
    }
    
    # Clean up compressed file
    Remove-Item $downloadPath -Force
    Write-Host "🧹 Cleaned up compressed file"
    
    # Verify extraction
    if (Test-Path $extractedPath) {
        $fileSize = (Get-Item $extractedPath).Length / 1GB
        Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
        Write-Host "   File: $extractedPath"
        Write-Host "   Size: $([math]::Round($fileSize, 2)) GB"
        Write-Host "`n🚀 Restart your server to use FastText vectors!"
    }
    else {
        Write-Host "❌ Extraction failed. Please manually extract the file." -ForegroundColor Red
        exit 1
    }
    
}
catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n📝 Manual download instructions:" -ForegroundColor Yellow
    Write-Host "   1. Download: $vectorUrl"
    Write-Host "   2. Extract to: $extractedPath"
    Write-Host "   3. Restart the server"
    exit 1
}

Write-Host "`n🎯 Ready for enhanced Korean word similarity!" -ForegroundColor Green
