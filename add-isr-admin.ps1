# PowerShell script to batch-add ISR configuration to admin pages
$adminPages = @(
    "audit-logs\page.tsx",
    "blog\page.tsx",
    "blog\new\page.tsx",
    "blog\[id]\page.tsx",
    "coupons\page.tsx",
    "course-tiers\page.tsx",
    "knowledge\page.tsx",
    "notifications\page.tsx",
    "redirects\page.tsx",
    "settings\page.tsx",
    "transactions\page.tsx",
    "courses\[courseId]\page.tsx"
)

$basePath = ".\src\app\(dashboard)\admin\"
$isrConfig = "// 2026 Performance: 2-minute cache for admin pages`nexport const revalidate = 120;`n"

foreach ($page in $adminPages) {
    $fullPath = Join-Path $basePath $page
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if ISR is already added
        if ($content -notmatch "export const revalidate") {
            # Find the position after imports and before export default
            $lines = Get-Content $fullPath
            $insertIndex = 0
            
            for ($i = 0; $i < $lines.Count; $i++) {
                if ($lines[$i] -match "^export const dynamic" -or $lines[$i] -match "^export default") {
                    $insertIndex = $i
                    break
                }
            }
            
            # Insert ISR config
            if ($insertIndex -gt 0) {
                $lines = @($lines[0..($insertIndex-1)]) + $isrConfig.Split("`n") + @($lines[$insertIndex..($lines.Count-1)])
                $lines | Set-Content $fullPath
                Write-Host "✅ Added ISR to: $page"
            }
        } else {
            Write-Host "⏭️ Skipped (already has ISR): $ page"
        }
    } else {
        Write-Host "❌ Not found: $page"
    }
}

Write-Host "`n✅ Batch ISR configuration complete!"
