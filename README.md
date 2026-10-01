# QEase AI - Virtual Queue Management & Customer Journey System

**QEase AI** is a production-grade, multi-tenant Virtual Queue Management and Customer Journey Application designed to eliminate physical waiting in walk-in establishments such as banks, urgent care clinics, telecom centers, and government offices.

---

## 🌟 Key Features

### 1. Business Operational Dashboard (`/admin/dashboard`)
- **One-Tap Queue Management**: Advance queue with a single click (**"NEXT CUSTOMER"**), hold tokens, mark no-shows, or pause counter availability.
- **Real-Time WebSocket Synchronization**: Emits Socket.io `QUEUE_ADVANCED`, `TOKEN_CREATED`, and `COUNTER_CHANGED` events with sub-200ms latency.
- **Counter Controls & Live Metrics**: Active counters count, waiting queue list, average wait duration, and socket latency ping widget.

### 2. Mobile Virtual Waiting Room (`/queue/:tenantSlug/:tokenId`)
- **Zero-App Accountless Access**: Customers scan a QR code or visit token URL (e.g., `/queue/abc-bank/token47`) without logging in.
- **Live Queue Position**: Real-time position counter showing people ahead.
- **Dynamic AI Wait Window**: AI-predicted wait window (e.g., `28–38 min`) and expected turn timestamp.
- **Mobility Guidance**: Clear *"Can I leave the premises?"* status badge (`Step Out` vs `Stay Nearby`).
- **Turn Notifications**: Triggers visual, audio, and haptic alerts when position reaches `≤ 2` ahead.
- **Document Prep Checklist**: Contextual document checklist based on chosen service (e.g., Aadhaar + PAN for KYC).

### 3. "Ask AI" Contextual Companion (Gemini 2.5 Flash SDK)
- Integrated drawer assistant using `@google/genai` model `gemini-2.5-flash`.
- Responds to customer questions (*"Can I go for lunch?"*, *"What documents do I need?"*) based on live position and queue velocity.
- **Sensitive ID Redaction Guard**: Strictly redacts any specific numeric digits for government IDs (Aadhaar, PAN, SSN) and only references generic document types.

### 4. Walk-in Reception Kiosk (`/kiosk/:tenantSlug`)
- Select walk-in service types (KYC Update, Cash Deposit, Loan Inquiry, etc.).
- Generate physical and digital QR code passes.

### 5. AI Queue Analytics (`/admin/analytics`)
- Historical throughput metrics, total customers served, average wait duration, and **94.8% Gemini AI Prediction Accuracy** score.

---

## 🏗 System Architecture & Technology Stack

- **Frontend**: React 18 (Vite), TypeScript, Tailwind CSS, Lucide React icons, Framer Motion, QR Code SVG, Socket.io client.
- **Backend**: Node.js, Express.js (TypeScript), Socket.io, `@google/genai` SDK (`gemini-2.5-flash`), `express-rate-limit`, `helmet`, `cors`, `zod` validation, `jsonwebtoken`.
- **Database**: PostgreSQL Production Schema (`db/schema.sql`) with Row Level Security (RLS) & indexes + dual in-memory fallback for zero-dependency instant startup.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) & npm

### 2. Environment Setup
Create a `.env` file in the project root or configure environment variables:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-token-key-change-in-production
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend starts on `http://localhost:5000`*

### 4. Run Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend starts on `http://localhost:5173`*

---

## 🗺 Application Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Marketing landing page & domain breakdown |
| `/auth/login` | Public | Staff teller & admin login |
| `/kiosk/:tenantSlug` | Receptionist | Walk-in kiosk to issue tokens & render QR codes |
| `/admin/dashboard` | Staff (Auth) | Live queue management panel with "NEXT CUSTOMER" button |
| `/admin/analytics` | Admin (Auth) | Hourly throughput and AI accuracy insights |
| `/queue/:tenantSlug/:tokenId` | Public | Mobile Virtual Waiting Room for walk-in customers |

---

## 🔒 Security & Data Isolation
- **Tenant Isolation**: Row Level Security (RLS) policies isolate tenant tokens and counter states.
- **Public Read Scope**: Public token lookups are scoped safely without exposing internal database structures.
- **Rate Limiting**: Public AI queries are limited to a maximum of 10 requests per minute per token (`express-rate-limit`).
- **ID Redaction**: Prevents echoing of numeric digits for sensitive identity numbers.
