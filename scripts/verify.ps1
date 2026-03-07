<#
.SYNOPSIS
    Cross-Check Validator — Post-implementation verification pipeline.
.DESCRIPTION
    Runs tests, builds, and prepares for post-implementation review.
.PARAMETER Scope
    What to verify: "all", "blog", "python", or "tests-only"
.EXAMPLE
    .\scripts\verify.ps1 -Scope "all"
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "blog", "python", "tests-only")]
    [string]$Scope = "all"
)

$ErrorCount = 0

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VERIFICATION PIPELINE                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Python Tests
if ($Scope -in "all", "python", "tests-only") {
    Write-Host "▶ Step 1: Python Tests (pytest)" -ForegroundColor Yellow
    Write-Host "  Running: python -m pytest tests/ -v" -ForegroundColor Gray
    
    try {
        $result = python -m pytest tests/ -v 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            Write-Host "  ✅ Python tests PASSED" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Python tests FAILED" -ForegroundColor Red
            $ErrorCount++
        }
        $result | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } catch {
        Write-Host "  ⚠️  pytest not available or no tests found" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 2: Blog Build
if ($Scope -in "all", "blog") {
    Write-Host "▶ Step 2: Blog Build (Next.js)" -ForegroundColor Yellow
    Write-Host "  Running: npm run build" -ForegroundColor Gray
    
    Push-Location blog
    try {
        $result = npm run build 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            Write-Host "  ✅ Blog build PASSED" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Blog build FAILED" -ForegroundColor Red
            $ErrorCount++
        }
    } catch {
        Write-Host "  ⚠️  npm build failed" -ForegroundColor Yellow
        $ErrorCount++
    }
    Pop-Location
    Write-Host ""
}

# Step 3: TypeScript Type Check
if ($Scope -in "all", "blog") {
    Write-Host "▶ Step 3: TypeScript Type Check" -ForegroundColor Yellow
    Write-Host "  Running: npx tsc --noEmit" -ForegroundColor Gray
    
    Push-Location blog
    try {
        $result = npx tsc --noEmit 2>&1
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            Write-Host "  ✅ TypeScript types OK" -ForegroundColor Green
        } else {
            Write-Host "  ❌ TypeScript errors found" -ForegroundColor Red
            $ErrorCount++
        }
    } catch {
        Write-Host "  ⚠️  TypeScript check skipped" -ForegroundColor Yellow
    }
    Pop-Location
    Write-Host ""
}

# Summary
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   RESULTS                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

if ($ErrorCount -eq 0) {
    Write-Host "  ✅ All checks PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next: Ask Analysis Team (Gemini) to do post-implementation review." -ForegroundColor Gray
    Write-Host "  Command: 'verify the implementation changes in [files]'" -ForegroundColor White
} else {
    Write-Host "  ❌ $ErrorCount check(s) FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Fix the errors before requesting post-implementation review." -ForegroundColor Yellow
}

Write-Host ""
exit $ErrorCount
