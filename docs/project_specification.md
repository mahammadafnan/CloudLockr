# CloudLockr (AI-Powered CSPM) - Complete Project Specification

This document provides the exhaustive technical blueprint, operational architecture, and roadmap for **CloudLockr** (formerly SentinelCloud), a production-grade Cloud Security Posture Management (CSPM) application.

---

## 1. Executive Summary & Product Scope
CloudLockr is a full-stack, multi-tenant cloud security scanner designed to resemble commercial CSPMs like Wiz, Prisma Cloud, or Lacework. It connects to cloud infrastructure providers (initially AWS) via programmatic APIs, builds an inventory of running assets, audits configurations against security baselines, calculates security posture indexes, alerts stakeholders of vulnerabilities, and uses generative AI to generate remediation scripts.

### Core Capabilities
*   **Resource Ingestion:** Automatic scanning of AWS services (EC2, S3, IAM, SGs, CloudTrail, RDS, VPC, EBS).
*   **Rules Audit Engine:** Evaluation of configurations against CIS AWS Foundations Benchmarks and NIST controls.
*   **Weighted Scoring Model:** Posture calculation (0-100 index) with weighted severity deductions.
*   **Aesthetic User Interface:** Premium dashboard featuring responsive glassmorphism structures, dark themes, and Chart.js analytics.
*   **Generative AI Assistant:** Interactive Gemini Pro integration providing natural language risk breakdowns and automated CLI correction scripts.
*   **DevSecOps Automation:** Node-cron scheduled scans, SMTP alerts (Nodemailer), and PDF report downloads (PDFKit).
*   **DevOps Orchestration:** Multi-container deployment via Docker Compose.

---

## 2. Complete Technical Stack
*   **Frontend (Single Page Application):**
    *   **React (Vite):** Client framework.
    *   **Tailwind CSS:** Responsive styling layer with dark theme controls.
    *   **React Router DOM (v6):** Client-side navigation routing.
    *   **Axios:** HTTP client for REST API communication.
    *   **Chart.js / React ChartJS 2:** Vulnerability trends and asset category graphs.
    *   **React Hot Toast:** System notifications.
    *   **React Icons (Hi/Ri):** Visual iconography.
*   **Backend (REST API Server):**
    *   **Node.js & Express:** Runtime and HTTP request framework.
    *   **JSON Web Tokens (JWT):** Stateless bearer token authentication.
    *   **bcryptjs:** Slow-hashing password encryption (10 salt rounds).
    *   **dotenv:** Environment configuration loading.
    *   **cors:** Cross-Origin requests management.
    *   **Nodemon:** Live reload development compiler.
*   **Database (NoSQL Engine):**
    *   **MongoDB:** Document store handling polymorphic cloud metadata.
    *   **Mongoose (ODM):** Schema validation, pre-save hooks, and relationships.
*   **Cloud & Third-Party APIs:**
    *   **AWS SDK v3:** Programmatic calls (STS, S3, EC2, IAM, CloudTrail).
    *   **Google Gemini API:** Conversational NLP and script generation.
*   **DevOps & Packaging:**
    *   **Docker & Docker Compose:** Containerization of React frontend, Node backend, and database services.

---

## 3. Directory Layout Blueprint
```
major_project/
├── docker/                 # Container configuration files
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── docs/                   # System guides & specifications
│   ├── aws_setup_guide.md
│   └── project_specification.md
├── screenshots/            # Visual dashboard logs
├── docker-compose.yml       # Orchestrates full stack services
├── README.md               # Main repo overview
├── .gitignore              # Global git exclusions
│
├── backend/                # Express backend application
│   ├── .env                # Credentials & ports config
│   ├── .gitignore          # Backend git exclusions
│   ├── package.json        # Dependencies list
│   └── src/
│       ├── app.js          # Express app routing mount
│       ├── server.js       # App listener & database bootstrapper
│       ├── config/
│       │   ├── aws.js      # AWS SDK credentials config
│       │   └── db.js       # Database connectivity utilities
│       ├── controllers/
│       │   ├── authController.js      # Login & register handlers
│       │   ├── dashboardController.js # Statistics aggregator
│       │   └── scanController.js      # Ingestion engine coordinator
│       ├── middleware/
│       │   └── auth.js     # JWT guard & RBAC roles filters
│       ├── models/
│       │   ├── User.js     # User credentials schema
│       │   ├── Resource.js # Discovered cloud assets schema
│       │   ├── Finding.js  # Risks & compliance issues schema
│       │   └── Scan.js     # Execution runs log schema
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── dashboardRoutes.js
│       │   └── scanRoutes.js
│       ├── scanners/       # AWS SDK client modules
│       │   ├── s3Scanner.js
│       │   ├── ec2Scanner.js
│       │   ├── iamScanner.js
│       │   ├── securityGroupScanner.js
│       │   └── cloudTrailScanner.js
│       └── utils/
│           ├── seed.js     # Database seeding command script
│           └── testAwsConnection.js # AWS connection validator
│
└── frontend/               # Vite React client application
    ├── index.html          # Web mounting template
    ├── package.json        # Node modules list
    ├── vite.config.js      # Proxy settings
    ├── tailwind.config.js  # Dark mode & cyber theme config
    ├── postcss.config.js   # Tailwind preprocessor hooks
    └── src/
        ├── App.jsx         # App routes & context provider
        ├── main.jsx        # DOM mounting file
        ├── components/
        │   ├── Navbar.jsx  # Header containing sun/moon theme toggle
        │   ├── Sidebar.jsx # Left panel navigation
        │   └── ProtectedRoute.jsx # Secure routing wrapper
        ├── context/
        │   └── AuthContext.jsx # Auth session context provider
        ├── layouts/
        │   └── DashboardLayout.jsx # Dashboard workspace shell
        ├── pages/
        │   ├── Dashboard.jsx # Metrics dashboard
        │   ├── Login.jsx     # Login screen
        │   └── Register.jsx  # Register screen
        └── styles/
            └── index.css     # Scrollbars, blurs, and pulse animations
```

---

## 4. End-to-End Operational Lifecycle
```
[AWS Cloud Accounts]
        │
   (Programmatic ReadOnly API calls via AWS SDK v3)
        │
        ▼
[Scanner Engine (scanners/)] ──(Parses to Mongoose Schemas)──> [MongoDB Database]
                                                                     │
                                                             [Rules Engine Check]
                                                                     │
                                                                     ▼
[Score recalculation] <──(Aggregates Active Violations)── [Findings Collection]
        │
        ▼
[Express Controller] ──(Pipes JSON output over JWT)──> [Vite React Client]
                                                                │
                                                         [Analyst Dashboard]
                                                                │
                                                       (Select vulnerability)
                                                                │
                                                                ▼
                                                       [Gemini Pro API call]
                                                                │
                                                                ▼
                                                       [AI Panel Explanation]
```

---

## 5. Detailed Database Schema Design

### 5.1. Users Collection
```js
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['Admin', 'Security Analyst', 'Viewer'], default: 'Viewer' },
  createdAt: { type: Date, default: Date.now }
}
```

### 5.2. Resources Collection
```js
{
  name: { type: String, required: true },
  service: { type: String, required: true, enum: ['EC2', 'S3', 'IAM', 'Security Groups', 'CloudTrail', 'VPC', 'EBS', 'RDS'] },
  type: { type: String, required: true },
  cloudProvider: { type: String, default: 'AWS' },
  accountId: { type: String, required: true },
  region: { type: String, default: 'us-east-1' },
  arn: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' },
  tags: { type: Map, of: String, default: {} },
  creationDate: { type: Date },
  lastScannedAt: { type: Date, default: Date.now }
}
```

### 5.3. Findings Collection
```js
{
  title: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, required: true, enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
  resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  resourceArn: { type: String, required: true },
  recommendation: { type: String, required: true },
  complianceMapping: {
    cisAWS: { type: String, default: 'N/A' },
    awsBestPractices: { type: String, default: 'N/A' },
    nist: { type: String, default: 'N/A' }
  },
  docLink: { type: String, default: 'https://docs.aws.amazon.com/' },
  status: { type: String, enum: ['Active', 'Resolved', 'Suppressed'], default: 'Active' },
  firstDetectedAt: { type: Date, default: Date.now },
  lastDetectedAt: { type: Date, default: Date.now }
}
```

### 5.5. Scans Collection
```js
{
  accountId: { type: String, required: true },
  status: { type: String, enum: ['In-Progress', 'Completed', 'Failed'], default: 'In-Progress' },
  resourcesScanned: { type: Number, default: 0 },
  findingsFound: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    informational: { type: Number, default: 0 }
  },
  totalFindings: { type: Number, default: 0 },
  securityScore: { type: Number, default: 100 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  error: { type: String }
}
```

---

## 6. The 12-Sprint Roadmap

*   **Sprint 1: Project Foundation (Completed ✅)**
    *   Setup folder structure, environment files, Git repository.
    *   Configure Node.js server, Express health endpoints, and initial Mongoose DB connectors.
*   **Sprint 2: Authentication + Dashboard UI (Completed ✅)**
    *   Configure React Router DOM, dynamic AuthContext state managers, and Protected Routes.
    *   Build styling scripts, Login/Register pages, Sidebar navigation, and Dark Mode toggles.
*   **Sprint 3: Backend APIs + MongoDB (Completed ✅)**
    *   Build Mongoose schemas and password bcrypt hashing mechanisms.
    *   Implement user registration, logins, JWT session issuance, and dashboard data aggregation APIs.
    *   Write the database seeder tool (`seed.js`).
*   **Sprint 4: AWS Fundamentals + AWS Setup (Completed ✅)**
    *   Configure AWS Free Tier sandbox and programmatic IAM read-only user access keys.
    *   Write the connection testing script (`testAwsConnection.js`) using AWS STS caller-identities.
*   **Sprint 5: AWS Scanner Engine (In Progress 🚀)**
    *   Develop S3, EC2, IAM, Security Groups, and CloudTrail scanner scripts using the AWS SDK v3.
    *   Write the main scan controller (`POST /api/scan`) with mock ingestion fallback modes.
*   **Sprint 6: Rule Engine + Security Scoring**
    *   Code rules checking logic to audit database configurations.
    *   Build weighted score deductions and write risk assessment records to the database.
*   **Sprint 7: Dashboard Integration + Findings**
    *   Connect the frontend charts, findings grids, search inputs, and filters to real database records.
*   **Sprint 8: Compliance + Reports**
    *   Map findings to CIS AWS Benchmarks.
    *   Develop the PDFKit report exporter to generate printable executive summaries.
*   **Sprint 9: AI Assistant**
    *   Connect Google Gemini API to analyze database findings and return remediation scripts on-demand.
*   **Sprint 10: Automation**
    *   Add node-cron scan schedulers (hourly/daily) and SMTP email alert controllers (Nodemailer).
*   **Sprint 11: Deployment + Docker + Testing**
    *   Write Dockerfiles and package frontend, backend, and MongoDB via Docker Compose.
*   **Sprint 12: Documentation + Viva Prep**
    *   Finalize API documents, architecture charts, readmes, and prepare mock interviews.

---

## 7. Rules Engine & Scoring Calculations

The rules engine audits resources and generates findings based on specific misconfigurations:

| Cloud Service | Security Rule | Default Severity | Weighted Deduction | CIS Mapping | NIST Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S3** | Bucket configured with Public Access allowed | **Critical** | `-20` | `2.1.1` | `PR.AC-4` |
| **S3** | Default bucket encryption disabled | **High** | `-10` | `2.1.2` | `PR.DS-1` |
| **EC2** | Security Group SSH ingress open to `0.0.0.0/0` | **Critical** | `-20` | `4.1` | `PR.PT-4` |
| **EC2** | Attached EBS Volume is unencrypted | **High** | `-10` | `2.2.1` | `PR.DS-1` |
| **IAM** | Root Account console login lacks MFA | **Critical** | `-20` | `1.1` | `PR.AC-6` |
| **IAM** | IAM User account console login lacks MFA | **Medium** | `-5` | `1.2` | `PR.AC-6` |
| **IAM** | Programmatic Access keys older than 90 days | **Low** | `-2` | `1.4` | `PR.AC-1` |
| **CloudTrail** | Configuration Audit Trail is disabled | **High** | `-10` | `1.1` | `DE.AE-3` |

### Security Score Index Calculation:
$$\text{Security Score} = \max\left(0, 100 - \sum \text{Deductions}\right)$$

---

## 8. GenAI Remediation Architecture

The Gemini Pro API handles remediation recommendations on-demand:

1.  **Trigger:** An analyst clicks a finding card, hitting `GET /api/ai/explain/:findingId`.
2.  **Context Construction:** The controller loads the finding and target resource details and builds a structured system prompt:
    ```
    System: You are an expert Cloud Security Engineer. Analyze the following vulnerability:
    - Service: ${finding.resourceId.service}
    - Title: ${finding.title}
    - Description: ${finding.description}
    - Resource ARN: ${finding.resourceArn}
    Explain the security risks in 3 bullet points. Provide the exact AWS CLI v2 command to fix it. Return only standard AWS CLI commands, no custom scripting.
    ```
3.  **API Call:** Backend dispatches the prompt to Gemini.
4.  **Fallback:** If the API fails or is rate-limited, the controller falls back to the database-stored static `finding.recommendation` text.
5.  **Rendering:** The response is returned as markdown and displayed on the client dashboard.

---

## 9. Interview & Viva Cheat Sheet

*   **Q: Why use a NoSQL database (MongoDB) instead of relational databases (SQL)?**
    *   *A:* Cloud resource inventories are highly polymorphic. S3 metadata holds bucket policies, EC2 holds instance states and network routes, and IAM holds console policies. Creating SQL tables for each unique service would require dozens of schemas and expensive join queries. MongoDB's document model allows us to store these diverse data shapes in a single `resources` collection using dynamic Mongoose Map structures.
*   **Q: What is the difference between encryption in transit and encryption at rest?**
    *   *A:* Encryption in transit secures data as it travels across the network (e.g. using HTTPS/TLS). Encryption at rest secures data stored on physical disks (e.g. S3 server-side encryption or EBS volume encryption using KMS keys) so that if the hardware is stolen, the data cannot be read.
*   **Q: How does the application enforce the principle of Least Privilege?**
    *   *A:* The scanner uses the AWS-managed policy `ReadOnlyAccess`. It is blocked from making any write, edit, or delete API requests, meaning it can only check configurations without altering the user's live infrastructure.
