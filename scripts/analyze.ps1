<#
.SYNOPSIS
    Analysis Pipeline — Calls Gemini for read-only codebase analysis.
.DESCRIPTION
    Generates an analysis report in docs/analysis-reports/
    using the analysis prompt template.
.PARAMETER Topic
    The topic/feature to analyze (e.g., "trending-ui", "auth-flow")
.PARAMETER Scope
    The scope of analysis (e.g., "blog/components", "full-codebase")
.EXAMPLE
    .\scripts\analyze.ps1 -Topic "trending-ui" -Scope "blog/components"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Topic,
    
    [Parameter(Mandatory=$false)]
    [string]$Scope = "full-codebase"
)

$Date = Get-Date -Format "yyyy-MM-dd"
$SafeTopic = $Topic -replace '\s+', '-'
$OutputDir = "docs\analysis-reports"
$OutputFile = "$OutputDir\$Date-$SafeTopic.md"
$TemplateFile = ".agents\prompts\analysis-template.md"

# Ensure output directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Check template exists
if (-not (Test-Path $TemplateFile)) {
    Write-Error "Template not found: $TemplateFile"
    exit 1
}

$Template = Get-Content $TemplateFile -Raw

Write-Host "=== ANALYSIS PIPELINE ===" -ForegroundColor Cyan
Write-Host "Topic:    $Topic" -ForegroundColor Yellow
Write-Host "Scope:    $Scope" -ForegroundColor Yellow
Write-Host "Output:   $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Option 1: Gemini CLI
Write-Host "Run this command in your preferred AI tool:" -ForegroundColor Green
Write-Host ""
Write-Host "  gemini -p `"Act as Analysis Agent per .agents/prompts/analysis-template.md." -ForegroundColor White
Write-Host "  Analyze scope: $Scope, topic: $Topic." -ForegroundColor White
Write-Host "  Read AGENTS.md first. Output report to: $OutputFile`"" -ForegroundColor White
Write-Host ""

# Option 2: Create a starter report file
$StarterReport = @"
# Analysis Report: $Topic
**Date:** $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssK")
**Analyst:** Gemini 2.5 Pro
**Scope:** $Scope

## 🔴 Critical Issues (P0 — Fix Immediately)
<!-- Fill in after analysis -->

## 🟡 High Priority (P1 — Fix This Sprint)
<!-- Fill in after analysis -->

## 🟢 Normal Priority (P2 — Next Sprint)
<!-- Fill in after analysis -->

## 🔵 Low Priority (P3 — Backlog)
<!-- Fill in after analysis -->

## 📐 Architecture Recommendations
<!-- Fill in after analysis -->

## ✅ Handoff to Implementation Team
- [ ] Task 1: 
- [ ] Task 2: 
"@

$StarterReport | Out-File -FilePath $OutputFile -Encoding utf8
Write-Host "Starter report created: $OutputFile" -ForegroundColor Green
Write-Host "Open in your AI IDE and ask it to fill in the analysis." -ForegroundColor Gray
