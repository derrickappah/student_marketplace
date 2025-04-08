# Create additional directory structure for further organization
$additionalDirectories = @(
    "scripts/utilities/tests",
    "scripts/utilities/database",
    "scripts/utilities/messaging",
    "scripts/batch/startup",
    "scripts/batch/deployment",
    "scripts/batch/database",
    "db/sql/migrations",
    "db/sql/fixes",
    "db/sql/functions",
    "docs/technical/database",
    "docs/technical/deployment",
    "docs/technical/fixes"
)

# Create directories
foreach ($dir in $additionalDirectories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory
        Write-Host "Created directory: $dir"
    }
}

# Further organize utility scripts
Get-ChildItem -Path "scripts/utilities" -Filter "*.js" | ForEach-Object {
    # Test scripts
    if ($_.Name -match "test|check") {
        Move-Item $_.FullName -Destination "scripts/utilities/tests/" -Force
        Write-Host "Moved $($_.Name) to scripts/utilities/tests/"
    }
    # Database scripts
    elseif ($_.Name -match "db|database|schema|migration|sql") {
        Move-Item $_.FullName -Destination "scripts/utilities/database/" -Force
        Write-Host "Moved $($_.Name) to scripts/utilities/database/"
    }
    # Messaging scripts
    elseif ($_.Name -match "message|conversation|notification") {
        Move-Item $_.FullName -Destination "scripts/utilities/messaging/" -Force
        Write-Host "Moved $($_.Name) to scripts/utilities/messaging/"
    }
}

# Further organize batch files
Get-ChildItem -Path "scripts/batch" -Filter "*.bat" | ForEach-Object {
    # Startup scripts
    if ($_.Name -match "start|minimal|run-without") {
        Move-Item $_.FullName -Destination "scripts/batch/startup/" -Force
        Write-Host "Moved $($_.Name) to scripts/batch/startup/"
    }
    # Deployment scripts
    elseif ($_.Name -match "deploy|install|fix-dependencies") {
        Move-Item $_.FullName -Destination "scripts/batch/deployment/" -Force
        Write-Host "Moved $($_.Name) to scripts/batch/deployment/"
    }
    # Database scripts
    elseif ($_.Name -match "promotion|stats|sql|logs|fix|data|migration") {
        Move-Item $_.FullName -Destination "scripts/batch/database/" -Force
        Write-Host "Moved $($_.Name) to scripts/batch/database/"
    }
}

# Further organize SQL files
Get-ChildItem -Path "db/sql" -Filter "*.sql" | ForEach-Object {
    # Migration scripts
    if ($_.Name -match "schema|updates|migration") {
        Move-Item $_.FullName -Destination "db/sql/migrations/" -Force
        Write-Host "Moved $($_.Name) to db/sql/migrations/"
    }
    # Fix scripts
    elseif ($_.Name -match "fix|simple|minimal") {
        Move-Item $_.FullName -Destination "db/sql/fixes/" -Force
        Write-Host "Moved $($_.Name) to db/sql/fixes/"
    }
    # Function scripts
    elseif ($_.Name -match "function|deploy") {
        Move-Item $_.FullName -Destination "db/sql/functions/" -Force
        Write-Host "Moved $($_.Name) to db/sql/functions/"
    }
}

# Further organize technical docs
Get-ChildItem -Path "docs/technical" -Filter "*.md" | ForEach-Object {
    # Database docs
    if ($_.Name -match "schema|sql|database|rls") {
        Move-Item $_.FullName -Destination "docs/technical/database/" -Force
        Write-Host "Moved $($_.Name) to docs/technical/database/"
    }
    # Deployment docs
    elseif ($_.Name -match "deploy|migration|guide") {
        Move-Item $_.FullName -Destination "docs/technical/deployment/" -Force
        Write-Host "Moved $($_.Name) to docs/technical/deployment/"
    }
    # Fix docs
    elseif ($_.Name -match "fix|status") {
        Move-Item $_.FullName -Destination "docs/technical/fixes/" -Force
        Write-Host "Moved $($_.Name) to docs/technical/fixes/"
    }
}

Write-Host "Further organization complete!" 