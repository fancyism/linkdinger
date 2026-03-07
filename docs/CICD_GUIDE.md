# CI/CD Pipeline Guide

> คู่มือตั้งค่า CI/CD Pipeline สำหรับ Linkdinger
> ตั้งแต่พื้นฐานจนถึง Production Deployment

---

## 📚 สารบัญ

1. [CI/CD คืออะไร?](#1-cicd-คืออะไร)
2. [GitHub Actions Setup](#2-github-actions-setup)
3. [Vercel Deployment](#3-vercel-deployment)
4. [Cloudflare Pages Alternative](#4-cloudflare-pages-alternative)
5. [Advanced Workflows](#5-advanced-workflows)
6. [Monitoring & Alerts](#6-monitoring--alerts)

---

## 1. CI/CD คืออะไร?

### 1.1 ความหมาย

```
CI = Continuous Integration
     └── รวมโค้ดเข้า main branch บ่อยๆ + Auto test

CD = Continuous Deployment/Delivery
     └── Deploy อัตโนมัติทุกครั้งที่ push
```

### 1.2 Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CI/CD PIPELINE                                │
└─────────────────────────────────────────────────────────────────────┘

  Developer          GitHub           CI Server         Production
     │                 │                 │                   │
     │  git push       │                 │                   │
     │────────────────▶│                 │                   │
     │                 │  webhook        │                   │
     │                 │────────────────▶│                   │
     │                 │                 │                   │
     │                 │                 │  ┌──────────────┐ │
     │                 │                 │  │ 1. Checkout  │ │
     │                 │                 │  │    code      │ │
     │                 │                 │  └──────┬───────┘ │
     │                 │                 │         │         │
     │                 │                 │  ┌──────▼───────┐ │
     │                 │                 │  │ 2. Install   │ │
     │                 │                 │  │ dependencies │ │
     │                 │                 │  └──────┬───────┘ │
     │                 │                 │         │         │
     │                 │                 │  ┌──────▼───────┐ │
     │                 │                 │  │ 3. Run tests │ │
     │                 │                 │  └──────┬───────┘ │
     │                 │                 │         │         │
     │                 │                 │  ┌──────▼───────┐ │
     │                 │                 │  │ 4. Build     │ │
     │                 │                 │  │ application  │ │
     │                 │                 │  └──────┬───────┘ │
     │                 │                 │         │         │
     │                 │                 │         │ deploy  │
     │                 │                 │────────────────▶ │
     │                 │                 │                   │
     │                 │  status         │                   │
     │◀────────────────│◀────────────────│                   │
     │                 │                 │                   │
```

### 1.3 Benefits

| Before CI/CD | After CI/CD |
|--------------|-------------|
| Manual testing | Auto test on every push |
| Manual deployment | Auto deploy on merge |
| "Works on my machine" | Consistent build environment |
| Late bug detection | Early bug detection |
| Slow releases | Multiple releases per day |

---

## 2. GitHub Actions Setup

### 2.1 Basic Workflow Structure

```yaml
# .github/workflows/main.yml

name: CI/CD Pipeline                    # Workflow name

on:                                     # Trigger conditions
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:                                   # Jobs to run
  build:
    runs-on: ubuntu-latest              # Runner OS
    
    steps:                              # Steps in job
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### 2.2 Linkdinger Blog Workflow

```yaml
# .github/workflows/blog.yml

name: Blog CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'blog/**'                      # Only trigger on blog changes
      - '.github/workflows/blog.yml'
  pull_request:
    branches: [main]
    paths:
      - 'blog/**'

jobs:
  # Job 1: Lint and Test
  lint-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: blog/package-lock.json
      
      - name: Install dependencies
        working-directory: ./blog
        run: npm ci
      
      - name: Run ESLint
        working-directory: ./blog
        run: npm run lint
      
      - name: Run tests
        working-directory: ./blog
        run: npm test

  # Job 2: Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-test                   # Wait for lint-test to pass
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: blog/package-lock.json
      
      - name: Install dependencies
        working-directory: ./blog
        run: npm ci
      
      - name: Build application
        working-directory: ./blog
        run: npm run build
        env:
          NEXT_PUBLIC_UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_URL }}
          NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TOKEN }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: blog/.next
          retention-days: 1

  # Job 3: Deploy (only on main branch)
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./blog
```

### 2.3 Setting Up Secrets

```bash
# Go to: GitHub Repository → Settings → Secrets and variables → Actions

# Required Secrets:
SECRETS:
├── UPSTASH_URL              # https://xxx.upstash.io
├── UPSTASH_TOKEN            # Upstash Redis token
├── SITE_URL                 # https://linkdinger.xyz
├── VERCEL_TOKEN             # Vercel API token
├── VERCEL_ORG_ID            # Vercel organization ID
└── VERCEL_PROJECT_ID        # Vercel project ID
```

#### How to Get Vercel Credentials

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
cd blog
vercel link

# 4. Get IDs from .vercel/project.json
cat .vercel/project.json

# 5. Create token at: https://vercel.com/account/tokens
```

### 2.4 Matrix Builds (Multiple Node Versions)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      
      - run: npm ci
      - run: npm test
```

---

## 3. Vercel Deployment

### 3.1 Vercel Configuration

```json
// vercel.json

{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  
  "regions": ["sin1"],  // Singapore (closest to Thailand)
  
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/fonts/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  
  "rewrites": [
    {
      "source": "/feed",
      "destination": "/rss.xml"
    }
  ],
  
  "redirects": [
    {
      "source": "/old-blog/:slug",
      "destination": "/blog/:slug",
      "permanent": true
    }
  ]
}
```

### 3.2 Environment Variables

```bash
# Vercel Dashboard → Project → Settings → Environment Variables

# Production
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_SITE_URL=https://linkdinger.xyz

# Preview (for PRs)
NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_SITE_URL=https://preview.linkdinger.xyz
```

### 3.3 Vercel CLI Deployment

```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel list
```

### 3.4 Automatic Deployments

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL AUTO DEPLOY                        │
└─────────────────────────────────────────────────────────────┘

GitHub Push Events:

main branch push
└── → Production deployment
    └── https://linkdinger.xyz

PR created/updated
└── → Preview deployment
    └── https://linkdinger-abc123.vercel.app

PR merged to main
└── → Production deployment
    └── https://linkdinger.xyz
```

---

## 4. Cloudflare Pages Alternative

### 4.1 Why Cloudflare Pages?

| Feature | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| Free tier | 100GB bandwidth | Unlimited bandwidth |
| Edge network | 70+ locations | 300+ locations |
| Build minutes | 6000/min month | 500/min month |
| R2 integration | External | Native |

### 4.2 Cloudflare Pages Configuration

```yaml
# .github/workflows/cloudflare-pages.yml

name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      deployments: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: blog/package-lock.json
      
      - name: Install dependencies
        working-directory: ./blog
        run: npm ci
      
      - name: Build
        working-directory: ./blog
        run: npm run build
        env:
          NEXT_PUBLIC_UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_URL }}
          NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TOKEN }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: linkdinger-blog
          directory: blog/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 4.3 Next.js Static Export for CF Pages

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static HTML export
  trailingSlash: true,
  images: {
    unoptimized: true  // Required for static export
  }
}

module.exports = nextConfig
```

```json
// package.json
{
  "scripts": {
    "build": "node scripts/generate-sitemap.mjs && node scripts/generate-rss.mjs && next build",
    "export": "next export"
  }
}
```

---

## 5. Advanced Workflows

### 5.1 Preview Deployments with Comments

```yaml
# .github/workflows/preview.yml

name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install and Build
        working-directory: ./blog
        run: |
          npm ci
          npm run build
        env:
          NEXT_PUBLIC_UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_URL }}
          NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_TOKEN }}
      
      - name: Deploy Preview
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./blog
      
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployed!\n\n**URL:** ${{ steps.deploy.outputs.preview-url }}`
            })
```

### 5.2 Database Migration Workflow

```yaml
# .github/workflows/migrate.yml

name: Database Migration

on:
  workflow_dispatch:  # Manual trigger
    inputs:
      environment:
        description: 'Environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run migrations
        run: |
          echo "Running migrations on ${{ inputs.environment }}..."
          # Add migration commands here
      
      - name: Notify on success
        if: success()
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-type: application/json' \
            -d '{"text":"✅ Migration completed on ${{ inputs.environment }}"}'
      
      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-type: application/json' \
            -d '{"text":"❌ Migration failed on ${{ inputs.environment }}"}'
```

### 5.3 Scheduled Tasks (Cron)

```yaml
# .github/workflows/scheduled.yml

name: Scheduled Tasks

on:
  schedule:
    # Run every day at 00:00 UTC
    - cron: '0 0 * * *'
  
  workflow_dispatch:  # Allow manual trigger

jobs:
  sitemap:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate sitemap
        working-directory: ./blog
        run: |
          npm ci
          node scripts/generate-sitemap.mjs
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add blog/public/sitemap.xml
          git diff --quiet && git diff --staged --quiet || git commit -m "chore: update sitemap"
          git push
```

### 5.4 Caching Strategies

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # Cache node_modules
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            blog/node_modules
            ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('blog/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      
      # Cache Next.js build
      - name: Cache Next.js
        uses: actions/cache@v4
        with:
          path: |
            blog/.next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('blog/package-lock.json') }}-${{ hashFiles('blog/**/*.js', 'blog/**/*.jsx', 'blog/**/*.ts', 'blog/**/*.tsx') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('blog/package-lock.json') }}-
```

---

## 6. Monitoring & Alerts

### 6.1 Slack Notifications

```yaml
# .github/workflows/notify.yml

name: Deployment Notifications

on:
  workflow_run:
    workflows: ["Blog CI/CD"]
    types:
      - completed

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "🚀 Deployment Successful"
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Repository:*\n${{ github.repository }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Branch:*\n${{ github.event.workflow_run.head_branch }}"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### 6.2 Health Check Workflow

```yaml
# .github/workflows/health-check.yml

name: Health Check

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check site health
        id: health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://linkdinger.xyz)
          echo "status_code=$response" >> $GITHUB_OUTPUT
          
          if [ "$response" -eq 200 ]; then
            echo "✅ Site is healthy"
          else
            echo "❌ Site returned $response"
            exit 1
          fi
      
      - name: Alert on failure
        if: failure()
        run: |
          curl -X POST "${{ secrets.SLACK_WEBHOOK }}" \
            -H 'Content-type: application/json' \
            -d '{"text":"🚨 Health check failed! Site returned ${{ steps.health.outputs.status_code }}"}'
```

### 6.3 Performance Monitoring (Lighthouse)

```yaml
# .github/workflows/lighthouse.yml

name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Lighthouse CI
        run: npm install -g @lhci/cli@0.13.x
      
      - name: Run Lighthouse
        run: |
          lhci autorun --upload.target=temporary-public-storage
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci
```

---

## Quick Reference

### Common GitHub Actions Commands

```yaml
# Checkout code
- uses: actions/checkout@v4

# Setup Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '20'

# Setup Python
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'

# Cache dependencies
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Run command
- run: npm test

# Conditional step
- name: Deploy
  if: github.ref == 'refs/heads/main'
  run: npm run deploy

# Environment variables
- run: npm run build
  env:
    NODE_ENV: production
    API_KEY: ${{ secrets.API_KEY }}

# Working directory
- run: npm test
  working-directory: ./blog
```

### Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

---

*Last updated: March 2026*
