# GolfGives — Golf Charity Subscription Platform

> Built for Digital Heroes Full Stack Developer Selection Process
> Developed by: Deepak (Ace) | BCA Graduate 2025

---

## 🌐 Live Links

| Service  | URL                                                          |
| -------- | ------------------------------------------------------------ |
| Frontend | https:/golf-charity-subscription-platform-opal.vercel.app    |
| Backend  | https://golf-charity-subscription-platform-ocv0.onrender.com |

---

## 🔑 Test Credentials

### Admin Account

```
Email:    admin@golfgives.com
Password: Admin@123456
```

### Subscriber Account

```
Email:    testuser@gmail.com
Password: Test@123456
```

---

## 🧪 Testing Checklist

| Test                                  | How to Test                                                    | Status |
| ------------------------------------- | -------------------------------------------------------------- | ------ |
| User signup & login                   | Go to /auth → create account → sign in                         | ✅     |
| Subscription flow monthly & yearly    | Sign in → /subscribe → choose plan → PayPal sandbox            | ✅     |
| Score entry 5-score rolling logic     | Dashboard → Module 2 → add 6 scores → oldest auto-deleted      | ✅     |
| Draw system logic and simulation      | Admin → Draws → create → simulate → publish                    | ✅     |
| Charity selection & contribution calc | Onboarding → pick charity → set % → dashboard Module 3         | ✅     |
| Winner verification & payout tracking | Admin → Winners → view proof → approve → mark paid             | ✅     |
| User Dashboard all modules            | /dashboard → all 5 modules functional                          | ✅     |
| Admin Panel full control              | /admin → all 5 sections functional                             | ✅     |
| Data accuracy                         | Prize pools: 40/35/25% auto-calculated, contributions enforced | ✅     |
| Responsive design                     | Test on mobile and desktop                                     | ✅     |
| Error handling & edge cases           | Try invalid scores, expired subscription, wrong roles          | ✅     |

---

## 🏗️ Tech Stack

### Frontend

- React 18 + Vite
- TailwindCSS v3
- Framer Motion (animations)
- React Router v6
- Supabase JS Client

### Backend

- Node.js + Express (ES Modules)
- Supabase (PostgreSQL + Auth + Storage + RLS)
- PayPal REST API (sandbox) — PCI-compliant per PRD Section 04
- Brevo SMTP (email notifications)
- Multer (file uploads)

### Deployment

- Frontend → Vercel (new account per PRD requirement)
- Backend → Render
- Database → Supabase Cloud

---

## 📁 Project Structure

```
golf-charity-platform/
│
├── supabase/
│   ├── schema.sql
│   └── seed.sql
│
├── backend/
│   ├── config/
│   │   └── constants.js
│   ├── lib/
│   │   └── supabase.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── drawEngine.js
│   │   ├── prizeCalculator.js
│   │   ├── emailService.js
│   │   └── uploadService.js
│   ├── controllers/
│   │   ├── scores.controller.js
│   │   ├── subscriptions.controller.js
│   │   ├── charities.controller.js
│   │   ├── draws.controller.js
│   │   ├── winners.controller.js
│   │   ├── donations.controller.js
│   │   └── admin.controller.js
│   ├── routes/
│   │   ├── scores.js
│   │   ├── subscriptions.js
│   │   ├── charities.js
│   │   ├── draws.js
│   │   ├── winners.js
│   │   ├── donations.js
│   │   └── admin.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── SubscriptionBadge.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── Onboarding.jsx
│   │   │   ├── Subscribe.jsx
│   │   │   ├── SubscribeSuccess.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Charities.jsx
│   │   │   ├── CharityDetail.jsx
│   │   │   ├── Draws.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminDraws.jsx
│   │   │       ├── AdminCharities.jsx
│   │   │       └── AdminWinners.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md

```

---

## 🗄️ Database Schema

```
profiles          → User profiles (extends Supabase auth)
subscriptions     → PayPal subscriptions, plan, status, lifecycle
scores            → Stableford scores 1-45, max 5 rolling per user
charities         → Charity listings with events
user_charities    → User charity selection + contribution %
donations         → Independent donations (not tied to gameplay)
draws             → Monthly draws with prize pool calculations
draw_entries      → User participation snapshot per draw
winners           → Match results, proof, verification, payout
```

---

## 💳 Payment Gateway

**PayPal REST API (Sandbox)**

> Note: Stripe is invite-only in India per RBI regulations.
> PayPal used as PCI-compliant equivalent per PRD Section 04 — "Stripe or equivalent PCI-compliant provider"

**PayPal Sandbox Test Buyer:**

```
Email:    sb-7zrvu50083938@personal.example.com
Password: [available in PayPal developer dashboard]
```

---

## 📧 Email Notifications

Powered by **Brevo SMTP** — works in production without domain verification.

Triggers:

- Subscription confirmation after payment
- Draw results to all participants after publish
- Winner alert with proof upload instructions
- Proof approved — payout in progress
- Proof rejected with admin reason

---

## 🎲 Draw Engine

**Random:** 5 unique numbers generated from 1-45 (Stableford range)

**Algorithmic:** Weighted by most AND least frequent user scores across platform

**Prize Pool Distribution:**

- 5-Number Match → 40% (Jackpot — rolls over if unclaimed)
- 4-Number Match → 35%
- 3-Number Match → 25%
- Multiple winners in same tier → prize split equally

---

## ⚙️ Environment Variables

### Backend (.env)

```
PORT=4000
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
BREVO_API_KEY=
FROM_EMAIL=
FROM_NAME=GolfGives
```

### Frontend (.env)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
VITE_PAYPAL_CLIENT_ID=
```

---

## 🚀 Local Development

```bash
# Backend
cd backend
npm install
npm run dev    # runs on port 4000

# Frontend
cd frontend
npm install
npm run dev    # runs on port 5173
```

---

_Built by Deepak for Digital Heroes Selection Process — March 2026_
