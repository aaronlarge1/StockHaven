# Stock Haven — one-time local database setup
# Run after PostgreSQL is installed

$PG_BIN = Get-ChildItem "C:\Program Files\PostgreSQL" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1 |
    ForEach-Object { "$($_.FullName)\bin" }

if (-not $PG_BIN) {
    Write-Error "PostgreSQL not found. Make sure it's installed."
    exit 1
}

Write-Host "Found PostgreSQL at: $PG_BIN"
$env:PATH = "$PG_BIN;$env:PATH"
$env:PGPASSWORD = ""   # initial empty password for superuser

# Set postgres superuser password
Write-Host "Setting postgres password..."
& "$PG_BIN\psql.exe" -U postgres -c "ALTER USER postgres PASSWORD 'stockhaven123';" 2>&1

# Create the database
Write-Host "Creating stock_haven database..."
& "$PG_BIN\createdb.exe" -U postgres stock_haven 2>&1

Write-Host "Done! Running initDb.js..."
$env:PGPASSWORD = "stockhaven123"
Set-Location "C:\Users\aaron\dev\StockHaven\server"
node scripts/initDb.js
