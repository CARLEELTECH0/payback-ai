# PAYBACK AI 🛡️
### Autonomous Chargeback Defense & Retention Copilot
**Built for the PayPal AI Developer Challenge**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis_7-red)](https://bullmq.io/)
[![PayPal APIs](https://img.shields.io/badge/PayPal-Disputes_%26_Invoicing-0070BA)](https://developer.paypal.com/)

> *"Don't lose your revenue to friendly fraud. Get your **PayBack** with PayPal."*

---

## 📌 1. The Unsolved Problem
Online merchants lose over **$100 billion** annually to chargebacks and "friendly fraud" (customers claiming *"Unauthorized Transaction"* or *"Item Not Received"* for digital services they legitimately consumed).

- **The Status Quo:** Assembling dispute evidence is completely manual. Merchants must hunt through server logs, locate user IP addresses, format invoice timestamps, take screenshots of database records, and draft a response within PayPal's strict 10-day deadline.
- **The Result:** Over **70% of small merchants give up** due to friction, automatically forfeiting their revenue plus paying a **$15–$25 dispute penalty fee**.

---

## ⚡ 2. The PayBack Solution
**PayBack** transforms your existing transactional database and audit logs into an **autonomous defense shield**:

1. **Instant Webhook Ingestion:** The moment a customer opens a dispute, PayBack's webhook listener activates.
2. **Deterministic Forensic Extraction:** Rather than hallucinating facts, PayBack queries PostgreSQL `audit_logs` and `transactions` to extract indisputable proof:
   - Account verification state & registration age
   - Exact client IP address and device fingerprint
   - Digital fulfillment token & provider gateway delivery receipt
   - **Post-purchase session logs** (proving the customer actively accessed the platform after purchase).
3. **Structured Legal Defense Brief:** PayBack's AI engine synthesizes a 5-point formal defense narrative formatted strictly to PayPal adjudication guidelines.
4. **Autonomous API Submission:** PayBack calls the **PayPal Customer Disputes API** (`/v1/customer/disputes/{id}/provide-evidence`) and submits the defense packet within **60 seconds** with zero human effort.
5. **Smart Pay Later Churn Bailout:** For failed recurring subscription debits, PayBack leverages **PayPal Invoicing & Pay Later** to dynamically offer customers 4 interest-free installments or payment date shifts.

---

## 🏗️ 3. Architecture & Data Flow

```
[ PayPal Customer Disputes ] 
          │ (CUSTOMER.DISPUTE.CREATED Webhook)
          ▼
┌────────────────────────────────────────────────────────┐
│                   PAYBACK API SERVER                   │
│                                                        │
│  1. Ingest Webhook ──────────────────────────────┐    │
│                                                  ▼    │
│  2. Extract Forensic Logs        [ PostgreSQL 16 ]    │
│     (IP, Session, Tokens) <───── (audit_logs & txns)  │
│                                                       │
│  3. Calculate Confidence Score (0-100%)               │
│                                                       │
│  4. Synthesize Legal Defense (PayBack AI Agent)       │
│                                                       │
│  5. Dispatch Proof ──────────────────────────────┐    │
└──────────────────────────────────────────────────┼─────┘
                                                   ▼
                                     [ PayPal Disputes API ]
                                 (/provide-evidence in 1.4s)
```

---

## 🛠️ 4. Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS custom design tokens, Mobile-first bottom navigation.
- **Backend API:** Express.js, Node.js 18+, JWT Bearer authentication, Winston structured logging.
- **Database & Ledger:** PostgreSQL 16 (Atomic double-entry ledger with row-level locks, UUID v4 keys).
- **Queues & Asynchronous Jobs:** Redis 7, BullMQ (exponential backoff retry pipelines).
- **PayPal APIs Integrated:**
  - **Disputes API (`/v1/customer/disputes`)**: Real-time evidence submission & status tracking.
  - **Invoicing API (`/v2/invoicing/invoices`)**: Dynamic installment recovery invoices.
  - **Subscriptions API**: Recurring schedule reconciliation.
  - **PayPal Checkout & Pay Later**: Multi-rail funding.

---

## 🚀 5. Quick Start (Run Locally)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Step 1: Start Infrastructure (PostgreSQL & Redis)
```bash
docker-compose up -d
```

### Step 2: Start Backend API Server
```bash
cd backend
npm install
npm run dev
# Server running at http://localhost:4000
```

### Step 3: Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:3000
# Navigate to http://localhost:3000/payback
```

---

## 🧪 6. Testing the Autonomous Defense Pipeline

Run the standalone end-to-end PayBack test suite:
```bash
cd backend
node src/modules/payback/test_payback.js
```

Or trigger an instant simulated dispute from the web UI at `http://localhost:3000/payback` to observe the real-time execution radar!

---

## 📜 7. License
Licensed under the [MIT License](LICENSE). Built for the PayPal AI Developer Challenge 2026.
