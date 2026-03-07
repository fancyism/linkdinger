<#
.SYNOPSIS
    Implementation Dispatcher — Routes tasks from analysis reports 
    to the appropriate AI model.
.DESCRIPTION
    Reads an analysis report and displays which items should go to
    which AI model based on priority level.
.PARAMETER ReportFile
    The analysis report filename (in docs/analysis-reports/)
.PARAMETER Priority
    Priority level to implement: P0, P1, P2, P3, or ALL
.EXAMPLE
    .\scripts\implement.ps1 -ReportFile "2026-03-05-trending-ui.md" -Priority "P1"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ReportFile,
    
    [Parameter(Mandatory=$false)]
    [string]$Priority = "ALL"
)

$ReportPath = "docs\analysis-reports\$ReportFile"

if (-not (Test-Path $ReportPath)) {
    Write-Error "Report not found: $ReportPath"
    Write-Host ""
    Write-Host "Available reports:" -ForegroundColor Yellow
    Get-ChildItem "docs\analysis-reports\*.md" | Where-Object { $_.Name -ne "README.md" } | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "=== IMPLEMENTATION DISPATCHER ===" -ForegroundColor Cyan
Write-Host "Report:   $ReportPath" -ForegroundColor Yellow
Write-Host "Priority: $Priority" -ForegroundColor Yellow
Write-Host ""

$Content = Get-Content $ReportPath -Raw

Write-Host "=== MODEL ROUTING GUIDE ===" -ForegroundColor Green
Write-Host ""
Write-Host "  P0/P1 (Critical/High) → Claude Opus 4" -ForegroundColor Red
Write-Host "    IDE: Antigravity or Claude Code CLI" -ForegroundColor Gray
Write-Host "    Best for: Complex features, refactors, architecture changes" -ForegroundColor Gray
Write-Host ""
Write-Host "  P2 (Normal) → Claude Sonnet 4" -ForegroundColor Yellow
Write-Host "    IDE: Kilo Code or Antigravity" -ForegroundColor Gray
Write-Host "    Best for: Standard implementation tasks" -ForegroundColor Gray
Write-Host ""
Write-Host "  P3 (Low) → GLM-4 / Codex" -ForegroundColor Green
Write-Host "    IDE: Kilo Code or Codex CLI" -ForegroundColor Gray
Write-Host "    Best for: TODOs, small fixes, routine work" -ForegroundColor Gray
Write-Host ""
Write-Host "=== SUGGESTED PROMPT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Read the analysis report at '$ReportPath'." -ForegroundColor White
Write-Host "  Implement all $Priority items following AGENTS.md guardrails." -ForegroundColor White
Write-Host "  Run tests after every change." -ForegroundColor White
