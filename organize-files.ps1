# Create directory structure
$directories = @(
    "db/migrations",
    "db/scripts", 
    "db/sql",
    "scripts/deployment",
    "scripts/utilities",
    "scripts/batch",
    "docs/project",
    "docs/migration",
    "docs/technical"
)

# Create directories
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory
        Write-Host "Created directory: $dir"
    }
}

# Move SQL files to db/sql
Get-ChildItem -Path "." -Filter "*.sql" | ForEach-Object {
    Move-Item $_.FullName -Destination "db/sql/" -Force
    Write-Host "Moved $($_.Name) to db/sql/"
}

# Move SQL files from scripts directory
Get-ChildItem -Path "scripts" -Filter "*.sql" | ForEach-Object {
    Move-Item $_.FullName -Destination "db/sql/" -Force
    Write-Host "Moved scripts/$($_.Name) to db/sql/"
}

# Move documentation files
Get-ChildItem -Path "." -Filter "*.md" | Where-Object { $_.Name -ne "README.md" } | ForEach-Object {
    # Technical docs
    if ($_.Name -match "migration|fix|schema|deploy|status|implementation") {
        Move-Item $_.FullName -Destination "docs/technical/" -Force
        Write-Host "Moved $($_.Name) to docs/technical/"
    }
    # Project docs
    elseif ($_.Name -match "project|team|presentation|important") {
        Move-Item $_.FullName -Destination "docs/project/" -Force
        Write-Host "Moved $($_.Name) to docs/project/"
    }
}

# Move documentation files from docs directory
Get-ChildItem -Path "docs" -Filter "*.md" | ForEach-Object {
    if ($_.Name -match "admin|troubleshooting|reports") {
        Move-Item $_.FullName -Destination "docs/technical/" -Force
        Write-Host "Moved docs/$($_.Name) to docs/technical/"
    }
}

# Move JavaScript utility files
Get-ChildItem -Path "." -Filter "*.js" | Where-Object {
    $_.Name -match "deploy|apply|fix|check|test|debug|create|setup|start|env"
} | ForEach-Object {
    # Database related scripts
    if ($_.Name -match "db|schema|migration|supabase|sql") {
        Move-Item $_.FullName -Destination "db/scripts/" -Force
        Write-Host "Moved $($_.Name) to db/scripts/"
    }
    # Deployment scripts
    elseif ($_.Name -match "deploy|setup|env") {
        Move-Item $_.FullName -Destination "scripts/deployment/" -Force
        Write-Host "Moved $($_.Name) to scripts/deployment/"
    }
    # Start scripts
    elseif ($_.Name -match "start|minimal") {
        Move-Item $_.FullName -Destination "scripts/utilities/" -Force
        Write-Host "Moved $($_.Name) to scripts/utilities/"
    }
    # Other utility scripts
    else {
        Move-Item $_.FullName -Destination "scripts/utilities/" -Force
        Write-Host "Moved $($_.Name) to scripts/utilities/"
    }
}

# Move JavaScript utility files from scripts directory
Get-ChildItem -Path "scripts" -Filter "*.js" | ForEach-Object {
    if ($_.Name -match "database|db|setup") {
        Move-Item $_.FullName -Destination "db/scripts/" -Force
        Write-Host "Moved scripts/$($_.Name) to db/scripts/"
    }
    elseif ($_.Name -match "test|report|form") {
        Move-Item $_.FullName -Destination "scripts/utilities/" -Force
        Write-Host "Moved scripts/$($_.Name) to scripts/utilities/"
    }
}

# Move batch files
Get-ChildItem -Path "." -Filter "*.bat" | ForEach-Object {
    Move-Item $_.FullName -Destination "scripts/batch/" -Force
    Write-Host "Moved $($_.Name) to scripts/batch/"
}

# Cleanup empty "database" file in scripts directory if it exists
if (Test-Path "scripts/database") {
    Remove-Item "scripts/database" -Force
    Write-Host "Removed incorrect scripts/database file"
}

Write-Host "File organization complete!" 