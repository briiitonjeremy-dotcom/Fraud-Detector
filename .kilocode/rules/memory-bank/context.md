# Active Context: FraudGuard AI - Fraud Detection Frontend

## Current State

**Application Status**: ✅ Built and ready for deployment

FraudGuard is a fintech web application for real-time fraud detection. The frontend is built with Next.js 16 and connects to a Python ML service running on Render.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] Complete FraudGuard Dashboard with fraud analytics
- [x] CSV Dataset Upload feature
- [x] Transaction Explainability page with SHAP features
- [x] ML API Test Console
- [x] Professional fintech-themed UI
- [x] Enhanced UI with polished fintech aesthetic (gradients, shadows, glows)

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main dashboard with analytics | ✅ Complete |
| `src/app/upload/page.tsx` | CSV dataset upload | ✅ Complete |
| `src/app/explain/page.tsx` | Transaction explainability | ✅ Complete |
| `src/app/api-test/page.tsx` | API test console | ✅ Complete |
| `src/app/layout.tsx` | Root layout | ✅ Complete |
| `src/app/globals.css` | Custom fintech styling | ✅ Complete |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## ML Backend Integration

The frontend connects to the ML service at:
- **URL**: https://ml-file-for-url.onrender.com
- **Endpoints Used**:
  - GET `/health` - Health check
  - POST `/predict` - Single transaction fraud prediction
  - POST `/process-dataset` - Batch CSV processing
  - GET `/explain/<transaction_id>` - SHAP-based explanation

## Deployment

- **Frontend**: Deploy to Vercel (Next.js)
- **Backend**: ML service already running on Render
- **Flow**: Frontend fetches data from Render ML backend

## Quick Start Guide

### To run locally:
```bash
bun install
bun run dev
```

### To build:
```bash
bun run build
```

### To deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-06 | Built complete FraudGuard application with dashboard, upload, explain, and API test pages |
| 2026-03-06 | Enhanced UI aesthetic with professional fintech theme (gradients, shadows, glows)
