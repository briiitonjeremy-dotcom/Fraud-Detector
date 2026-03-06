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
- [x] Enhanced UI with polished fintech aesthetic
- [x] Dark theme with blue accents
- [x] Cleaner, refined dashboard styling matching reference design
- [x] Fix hallucinating dashboard - use real data from uploads
- [x] Add Clear Data button to dashboard header
- [x] Add "Save to Database" button on Explain page
- [x] Link transaction data from Explain page to dashboard
- [x] Fix: Show actual CSV columns dynamically on upload page
- [x] Fix: Show actual transaction count (100k) instead of sample count (5)
- [x] Fix: Process more transactions (up to 1000) from uploaded CSV
- [x] Fix: Use actual isFraud column from CSV instead of random scores
- [x] Fix: Generate transaction IDs using step and row index
- [x] Fix: Display more transactions in dashboard table (20 instead of 10)
- [x] Fix: Handle null/undefined fraud scores properly in UI

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Main dashboard with analytics | ✅ Complete |
| `src/app/upload/page.tsx` | CSV dataset upload | ✅ Complete |
| `src/app/explain/page.tsx` | Transaction explainability | ✅ Complete |
| `src/app/api-test/page.tsx` | API test console | ✅ Complete |
| `src/app/layout.tsx` | Root layout | ✅ Complete |
| `src/app/globals.css` | Custom styling | ✅ Complete |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## How to Use the Application

1. **Upload Dataset**: Go to `/upload` to upload a CSV file of transactions
2. **Analyze Transaction**: Go to `/explain`, enter a transaction ID, click "Explain"
3. **Save to Database**: Click "Save to Database" after analyzing to store for future predictions
4. **View Dashboard**: See the latest analyzed transaction on the dashboard
5. **Clear Data**: Click "Clear Data" button to reset all stored data

## ML Backend Integration

The frontend connects to the ML service at:
- **URL**: https://ml-file-for-url.onrender.com
- **Endpoints Used**:
  - GET `/health` - Health check
  - POST `/predict` - Single transaction fraud prediction
  - POST `/process-dataset` - Batch CSV processing
  - GET `/explain/<transaction_id>` - SHAP-based explanation

## Data Flow

1. User uploads CSV dataset on `/upload` page → ML processes it → Results stored in localStorage
2. User analyzes transaction on `/explain` page → Can save to database (localStorage)
3. Dashboard displays: processed dataset stats + latest analyzed transaction
4. Clear Data button resets everything

## Deployment

- **Frontend**: Deploy to Vercel (Next.js)
- **Backend**: ML service already running on Render
- **Flow**: Frontend fetches data from Render ML backend

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-03-06 | Built complete FraudGuard application with dashboard, upload, explain, and API test pages |
| 2026-03-06 | Enhanced UI aesthetic with professional fintech theme (gradients, shadows, glows) |
| 2026-03-06 | Dark theme with blue accents, glassmorphism, and grid overlay |
| 2026-03-06 | Cleaner dashboard styling to match reference design |
| 2026-03-06 | Fixed hallucinating dashboard - removed hardcoded fake data |
| 2026-03-06 | Added Clear Data button and Save to Database features |
