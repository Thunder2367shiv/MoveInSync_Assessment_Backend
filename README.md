# MoveInSync Guard – Backend API

This is the backend service for the MoveInSync Guard intelligent alert monitoring system. It acts as the core engine of the platform, responsible for processing incoming sensor data, applying business rules, escalating alerts, resolving events automatically, and maintaining real-time dashboard statistics used by the frontend.

The backend is designed for **high scalability**, **low-latency reads**, and **modular logic separation**, using a Service-Oriented Architecture (SOA) with caching and optimized database queries.

===========================================================
PROJECT OVERVIEW (DETAILED)
===========================================================

The backend handles the entire lifecycle of a fleet safety alert — starting from receiving a raw sensor input all the way to resolution.

Its responsibilities include:

* **Ingestion of high-volume sensor data** such as overspeeding, document expiry, and system feedback.
* **Rule Engine Execution** where incoming events are evaluated against configurable rules (stored in the database).
* **Severity Escalation** using logic like:
  - Info → Warning → Critical (“3-strikes system”).
* **Automatic Resolution** of stale or updated alerts through:
  - Time-based cron jobs.
  - Event triggers (e.g., document renewed).
* **Real-time Dashboard Stats** computed using a write-through caching model to achieve O(1) read time.
* **RBAC (Role-Based Access Control)** where Admins manage configurations, while Operators monitor activity.

This backend ensures that the entire fleet safety system remains consistent, fast, and fault-tolerant.

===========================================================
TECH STACK (EXPLAINED)
===========================================================

* **Node.js** — Runtime environment for executing JavaScript server-side.
* **Express.js** — Lightweight framework for building APIs.
* **MongoDB + Mongoose** — Stores alerts, driver data, rules, users, and statistics.
* **JWT Authentication** — Secures all protected routes with tokens.
* **Bcrypt.js** — Safely hashes user passwords.
* **Node-Cron** — Runs scheduled background jobs (cleanup, auto-close).
* **Controller-Service-Model Pattern** — Improves readability and scalability by separating logic layers.

===========================================================
SETUP & INSTALLATION (DETAILED)
===========================================================

1. **Prerequisites**
   - Node.js v14+
   - MongoDB running locally or an Atlas connection string

2. **Install Dependencies**
   - cd backend
   - npm install

4. **Environment Variables**
   - Create a `.env` file:
   - PORT=4000
   - MONGO_URI=mongodb://localhost:27017/moveinsync_alerts
   - JWT_SECRET=your_super_secret_key_here

5. **Run the Server (Development)**

6. **Run in Production**

7. **Initial Seeding (First Time Setup)**
The system requires initial rule definitions (overspeed, document, feedback).

Send a POST request:
POST http://localhost:4000/api/alerts/seed

===========================================================
DIRECTORY STRUCTURE (WITH EXPLANATION)
===========================================================

src/
├── config/  
│   └── index.js — Database connection logic (MongoDB).  
│
├── controllers/  
│   └── Handles incoming API requests, responds with JSON.  
│
├── middlewares/  
│   ├── auth.js — JWT verification middleware.  
│   └── errorHandler.js — Unified error handling.  
│
├── models/  
│   ├── Alert.js — Stores alert lifecycle.  
│   ├── Driver.js — Driver profile + alert counters.  
│   ├── Rule.js — Stores dynamic rule thresholds.  
│   ├── User.js — Admin/Operator accounts.  
│   └── SystemStat.js — Cached counters for dashboard.  
│
├── routes/  
│   └── Defines API endpoints for auth, alerts, dashboard, admin actions.  
│
├── services/  
│   ├── ruleEngine.js — Main business logic for escalation.  
│   └── scheduler.js — Cron job for auto-closing stale alerts.  
│
└── server.js — Entry point to start Express server.

===========================================================
KEY FEATURES (FULL EXPLANATION)
===========================================================

1. INTELLIGENT RULE ENGINE
--------------------------------------
This engine processes every incoming event. For example:

* If a driver overspeeds 3 times within 60 minutes → escalate from Warning to Critical.
* Rules are stored in DB → admins can update without code changes.
* Escalation decisions and timestamps are logged for audit.

2. HIGH-PERFORMANCE ANALYTICS
--------------------------------------
The backend uses smart optimizations:

* **SystemStat (Write-Through Cache):**  
Whenever an alert changes state, counters update instantly.  
→ Dashboard reads become **O(1)**.

* **Top-Offenders Leaderboard:**  
Uses indexed fields like `activeAlertCount` to fetch results in **O(log N)**.

3. AUTOMATED RESOLUTION
--------------------------------------
Two types:

**Event-Based Auto-Close:**  
If a document renewal event arrives → all related expiry alerts close automatically.

**Time-Based Auto-Close:**  
Cron job checks every 5 minutes:  
If an alert is OPEN for >24 hours → mark it AUTO-CLOSED.

4. ROLE-BASED ACCESS CONTROL (RBAC)
--------------------------------------
User roles:

* **Admin** — Manage rules, run simulations, reset or sync data.
* **Operator** — View dashboard and resolve alerts manually.

===========================================================
API REFERENCE (DETAILED)
===========================================================

AUTHENTICATION
--------------
POST /api/auth/register  
POST /api/auth/login  

ALERT INGESTION & EVENTS
--------------
POST /api/alerts/ingest  
→ Used by sensor systems to submit data.

POST /api/alerts/event  
→ Triggers document renewal and other system events.

GET /api/alerts/recent  
→ Returns last 20 lifecycle events.

GET /api/alerts/:id  
→ Full details of the alert.

PUT /api/alerts/:id/resolve  
→ Manually resolve the alert.

DASHBOARD (READ-OPTIMIZED)
--------------
GET /api/dashboard/stats  
GET /api/dashboard/top-offenders  
GET /api/dashboard/history  
GET /api/dashboard/auto-closed  

ADMIN CONFIGURATION
--------------
GET /api/alerts/rules  
PUT /api/alerts/rules/:id  
POST /api/rules/analyze  
POST /api/alerts/reset  
POST /api/alerts/sync  

===========================================================
CORE LOGIC EXPLANATION
===========================================================

THE RULE ENGINE  
--------------------------------------
Located at: `src/services/ruleEngine.js`

* Evaluates raw input → severity and status updates.
* Implements 3-strike escalation.
* Updates driver stats and SystemStat atomically.
* Ensures consistent transitions between lifecycle stages.

THE SCHEDULER  
--------------------------------------
Located at: `src/services/scheduler.js`

A cron job running every 5 minutes:

* Finds alerts older than 24 hours.
* Marks them AUTO-CLOSED.
* Updates dashboard counters.

===========================================================
TROUBLESHOOTING
===========================================================

1. **Dashboard counters stuck at 0**
- Run:
  ```
  POST /api/alerts/sync
  ```
- Recalculates all counters from the database.

2. **Admin-only routes returning “Access Denied”**
- Make sure your user’s role is `"admin"`.
- Check MongoDB `users` collection.

3. **MongoDB not connecting**
- Ensure MongoDB server is running (`mongod`).
- For Atlas: Add your IP to the whitelist.

===========================================================
DONE!
===========================================================
