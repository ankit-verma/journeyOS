# JourneyOS — AI-Powered Travel Platform

> **IBM TechXchange 2026 Pre-conference Dev Day Hackathon Submission**  
> Built autonomously with **IBM SmartBob Framework v1** · Powered by **IBM watsonx.ai**

[![Live App](https://img.shields.io/badge/Live%20App-journeyos.onrender.com-2563eb)](https://journeyos.onrender.com/)
[![AI Model](https://img.shields.io/badge/AI-watsonx.ai%20%7C%20llama--3--3--70b-0f62fe)](https://www.ibm.com/products/watsonx-ai)
[![Built With](https://img.shields.io/badge/Built%20with-IBM%20SmartBob%20Framework%20v1-0d9488)](https://github.com/ankit-verma/journeyOS)

---

## 🌍 Application URL

| Resource | URL |
|----------|-----|
| **Live Application** | https://journeyos.onrender.com/ |
| **Admin Dashboard** | https://journeyos.onrender.com/admin |
| **Live AI Demos** | https://journeyos.onrender.com/demo |
| **Backend API** | https://journeyos.onrender.com/api |

**Admin credentials** (for reviewer/judge access):
- Email: `admin@journeyos.com`
- Password: `admin123`

---

## 🚀 What is JourneyOS?

JourneyOS is a full-stack travel booking platform with an AI chatbot that creates **personalised, dynamically-priced travel plans on-the-fly** using IBM watsonx.ai. The chatbot collects destination, duration, travel style, group size and budget through natural conversation, then generates a complete structured itinerary with itemised pricing — which users can purchase with one click to create a real confirmed booking.

### Key Features

- 🤖 **AI Travel Planner** — conversational interface powered by IBM watsonx.ai (meta-llama/llama-3-3-70b-instruct)
- 📋 **Dynamic Plan Generation** — structured `travel-plan` JSON with 5-category price breakdown
- 💳 **One-Click Booking** — AI plan converts to a real `trips` + `bookings` DB record instantly
- 🔄 **4-Provider Failover** — watsonx.ai → OpenAI → Claude → Built-in BOB engine (100% uptime)
- ⚡ **Live Token Metering** — per-session token tracking with admin analytics dashboard
- 🗄️ **Admin AI Panel** — manage provider, knowledge base, system prompt, sessions and token stats
- 🔒 **JWT Authentication** — secure register/login with bcrypt password hashing

---

## 🧠 Built with IBM SmartBob Framework v1

The entire application was built from scratch using **IBM SmartBob Framework v1** — a multi-agent orchestration system. SmartBob coordinated parallel specialist agents:

| Agent | Responsibility |
|-------|----------------|
| **SmartBob** (Orchestrator) | Discovered stack, built task graph, managed dependency ordering |
| **BobOps** | Schema, all 30+ REST endpoints, JWT auth, watsonx.ai integration, Render deployment |
| **BobCompliance** | API key security, .gitignore/.bobignore, requireAdmin guards |
| **BobData** | Token logging schema, analytics endpoints, Chart.js dashboard |
| **BobKT** | Knowledge base seeding, .env.example, documentation |
| **BobCEO** | Product framing, dynamic pricing model design |

---

## 🔬 IBM watsonx.ai Integration

```
Model:    meta-llama/llama-3-3-70b-instruct
Endpoint: us-south.ml.cloud.ibm.com/ml/v1/text/generation
Auth:     IBM IAM token exchange (iam.cloud.ibm.com/identity/token)
Params:   decoding_method=greedy, max_new_tokens=800
```

Environment variables (set in Render — never in source code):
```
WATSONX_API_KEY=<your-ibm-cloud-iam-api-key>
WATSONX_PROJECT_ID=<your-watsonx-project-uuid>
WATSONX_REGION=us-south
```

See [`.env.example`](.env.example) for the full configuration template.

---

## 🏃 Running Locally

```bash
# 1. Clone
git clone https://github.com/ankit-verma/journeyOS.git
cd journeyOS/journeyos

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — add your WATSONX_API_KEY and WATSONX_PROJECT_ID

# 4. Start
npm start
# → http://localhost:3000
```

**Node.js 22.5+ required** (uses built-in `node:sqlite` — no native compile step).

---

## 📁 Project Structure

```
journeyos/
├── server.js          # Express app — 30+ REST API endpoints, AI chatHandler, watsonx integration
├── db.js              # SQLite schema (8 tables), seed data, provider auto-promotion on startup
├── .env.example       # Environment variable template (no real credentials)
├── .gitignore         # Prevents accidental credential exposure
├── .bobignore         # IBM Bob ignore rules (aligned with hackathon template)
├── render.yaml        # Render.com IaC deployment config
├── package.json       # Dependencies: express, cors, jsonwebtoken, bcryptjs
└── public/
    ├── index.html     # SPA frontend — destinations, trips, booking, AI chat widget
    ├── admin.html     # Admin dashboard — analytics, AI settings, knowledge base
    ├── demo.html      # Live interactive demos (3 demos)
    ├── admin-login.html
    ├── privacy.html
    └── terms.html
```

---

## 🔒 Security — Credential Safety

> ⚠️ **IBM Cloud credentials must NEVER be committed to this repository.**  
> If IBM Cloud credentials are detected through IBM security monitoring, your IBM Cloud account may be suspended immediately.

This project follows all IBM Hackathon security guidelines:

- ✅ All API keys (watsonx, OpenAI, Claude) stored as **environment variables only**
- ✅ `.env` file is in `.gitignore` and `.bobignore` — never committed
- ✅ `render.yaml` uses `generateValue: true` for JWT_SECRET — no hardcoded secrets
- ✅ `.env.example` contains only placeholder values (no real keys)
- ✅ `journeyos.db` (SQLite runtime database) is gitignored

---

## 📊 IBM Bob Task Session Summaries

SmartBob session screenshots are included in the [`docs/bob-sessions/`](docs/bob-sessions/) directory.

See the full exported SmartBob session report:  
📄 [`smartbob-framework-journeyos-demo-report.html`](../smartbob-framework-journeyos-demo-report.html)

See the full hackathon submission document (PDF-ready):  
📄 [`journeyos-ibm-techxchange-2026-hackathon-demo.html`](../journeyos-ibm-techxchange-2026-hackathon-demo.html)

---

## 👤 Developer

- **GitHub:** [vermaankit004](https://github.com/vermaankit004)
- **Repository:** [github.com/ankit-verma/journeyOS](https://github.com/ankit-verma/journeyOS)
- **Hackathon:** IBM TechXchange 2026 Pre-conference Dev Day Hackathon
