$migrationFiles = Get-ChildItem -Path "D:\\UTSAV\\backend\\migrations\\versions" -Filter "*.py" | Where-Object { $_.Name -notmatch "__pycache__" }

foreach ($file in $migrationFiles) {
    Write-Host "=== $($file.Name) ==="
    
    $content = Get-Content $file.FullName
    $inUpgrade = $false
    $inDowngrade = $false
    
    foreach ($line in $content) {
        $stripped = $line.Trim()
        
        if ($stripped -like "def upgrade*:") {
            $inUpgrade = $true
            $inDowngrade = $false
            continue
        }
        if ($stripped -like "def downgrade*:") {
            $inDowngrade = $true
            $inUpgrade = $false
            continue
        }
        
        if ($inUpgrade -or $inDowngrade) {
            if ($stripped -match "^op\.(create_table|drop_table|add_column|drop_column|create_index)") {
                Write-Host "  $stripped"
            }
        }
    }
    
    Write-Host ""
}
