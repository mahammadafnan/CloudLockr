# CloudLockr 🛡️

**AI-Powered Cloud Security Posture Management (CSPM) Platform**

CloudLockr is an automated cloud security posture assessment application designed to audit AWS cloud infrastructure configurations against industry-standard security baselines. It delivers real-time asset discovery, security score calculations, compliance checklist mappings, PDF reports compilation, and automated background schedulers with alert dispatch routines. 

The platform features a **GenAI Security Assistant** powered by the **Google Gemini API** to explain vulnerabilities and generate copy-pasteable AWS CLI v2 remediation scripts.

---

## ⚙️ Tech Stack & Pillars

*   **Frontend Client:** React (Vite), Tailwind CSS (Apple-style dark mode theme), Axios, React Router, React Icons, React Hot Toast, Chart.js.
*   **Backend Server:** Node.js, Express, Mongoose, JWT session auth, bcryptjs password hashes.
*   **Database:** MongoDB Community Server (Collections: Users, Resources, Findings, Scans).
*   **Cloud Ingestion:** AWS SDK v3 (STS, S3, EC2, IAM, CloudTrail client libraries).
*   **AI Integration:** Google Generative AI Node SDK (`gemini-1.5-flash` model).
*   **Automation & Reports:** PDFKit (Direct binary response stream), Nodemailer, node-cron task schedulers.
*   **Deployment:** Docker containerization, multi-stage frontend build (served via Nginx), Docker Compose.

---

## 🏗️ Folder Structure

```
major_project/
├── docker/                 # Container Dockerfiles (backend.Dockerfile, frontend.Dockerfile)
├── backend/                # Express API Backend server
│   ├── src/
│   │   ├── config/         # MongoDB, AWS configuration settings
│   │   ├── controllers/    # Route controllers (Auth, Dashboard, Scan, AI, Reports)
│   │   ├── models/         # Mongoose DB Schemas (User, Resource, Finding, Scan)
│   │   ├── rules/          # Modular rules registry engine configuration check files
│   │   ├── utils/          # Schedulers, Alert mailers, unified ScanEngine services
│   │   └── app.js / server.js
│   └── package.json
└── frontend/               # React Frontend client app
    ├── src/
    │   ├── components/     # Layout pieces (Sidebar, Navbar, ProtectedRoute)
    │   ├── context/        # React AuthState API contexts
    │   ├── layouts/        # Dashboard view wrappers
    │   ├── pages/          # App pages (Dashboard, CloudAccounts, Explorer, Findings, etc.)
    │   └── styles/         # Apple colors theme stylesheet configurations
    ├── vite.config.js      # Vite dev proxy configuration settings
    └── nginx.conf          # Nginx proxy mapping routes config (Docker)
```

---

## 🚀 Setup & Running Instructions

### Option A: Local Launch (Using Node & CMD workarounds)

Ensure you have **MongoDB** installed and running on port `27017` locally.

1.  **Configure Environment:**
    *   Create a file `backend/.env` containing:
        ```ini
        PORT=5000
        MONGODB_URI=mongodb://127.0.0.1:27017/cloudlockr
        JWT_SECRET=yoursupersecuresecretkey
        GEMINI_API_KEY=your_google_gemini_api_key_here
        # OPTIONAL SMTP ALERTS:
        SMTP_HOST=
        SMTP_PORT=2525
        SMTP_USER=
        SMTP_PASS=
        ALERT_RECEIVER=admin@cloudlockr.local
        ```
2.  **Seed the Database:**
    Open a terminal and run the seeder script to populate mock assets:
    ```bash
    cd backend
    node src/utils/seed.js
    ```
3.  **Boot the Backend API Server:**
    ```bash
    cmd /c npm run dev
    ```
    *(Consoles: `[Server] CloudLockr Backend is listening on port 5000`)*
4.  **Boot the Frontend React Client:**
    Open a **new separate terminal** and run:
    ```bash
    cd frontend
    cmd /c npm run dev
    ```
    *(Open browser to: `http://localhost:5173/`)*

---

### Option B: Docker Orchestration (Production deployment)

If you have Docker Desktop running, spin up the entire containerized stack:

1.  **Launch Stack:**
    ```bash
    docker compose up -d --build
    ```
2.  **Seed the Container Database:**
    ```bash
    docker exec -it cloudlockr-backend node src/utils/seed.js
    ```
3.  **Verify:** Open `http://localhost:5173`. Nginx will serve the React app and proxy requests to the backend container.

---

## 🛡️ CIS Compliance Audit Scope

The decoupled rules registry (`backend/src/rules/`) dynamically audits resources against these CIS parameters:
*   **CIS 1.1:** Ensure CloudTrail Logging is enabled (High risk)
*   **CIS 1.2:** Ensure Multi-Factor Authentication (MFA) is active for Console Users (Medium risk)
*   **CIS 1.4:** Ensure programmatic access keys are rotated every 90 days (Low risk)
*   **CIS 2.1.1:** Ensure S3 Buckets block public access (Critical risk)
*   **CIS 2.1.2:** Ensure default server-side encryption is active on S3 buckets (High risk)
*   **CIS 2.2.1:** Ensure EBS volume encryption is active (High risk)
*   **CIS 4.1:** Ensure Security Groups block public ingress on Port 22 (Critical risk)
*   **CIS 4.2:** Ensure Security Groups block public ingress on Port 3389 (Critical risk)
