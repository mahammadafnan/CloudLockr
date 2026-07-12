# CloudLockr - Master Interview & Viva Preparation Guide

This document contains expert, structured answers to the 23 key interview and viva questions regarding **CloudLockr** (AI-Powered CSPM). Use this as a study guide to prepare for technical screenings and project presentations.

---

## Group 1: Problem & Motivation

### 1. What problem does CloudLockr solve, and who is the target user?
*   **Answer**: CloudLockr solves the problem of **cloud security drift and misconfigurations**. In public clouds (like AWS), security is a shared responsibility; developers frequently make buckets public, open SSH ports to the internet, or disable audit trails by accident, leading to data leaks.
*   **Target User**: Cloud Engineers, Security Analysts, and DevSecOps teams who need a consolidated dashboard to monitor security posture, track compliance, and get immediate AI-guided fixes.

### 2. Why did you choose AWS specifically, and do you plan to support Azure/GCP later?
*   **Answer**: AWS is the market leader in public cloud services, making it the most relevant platform to secure first. The codebase is designed modularly using the **Strategy Design Pattern**; scanner interfaces are separated from database models. This means we can add `azureScanner.js` or `gcpScanner.js` in the future by mapping their APIs to the same Mongoose `Resource` and `Finding` models.

### 3. What existing tools (e.g., AWS Security Hub, Prowler, ScoutSuite) solve this problem, and how is yours different?
*   **Answer**: Commercial tools exist (like Wiz or Prisma Cloud), and open-source CLI tools exist (like Prowler or ScoutSuite). CloudLockr bridges the gap for mid-sized teams:
    1.  **Conversational AI Remediation:** Unlike Security Hub which only flags issues, CloudLockr integrates the Gemini API to explain *why* it's a risk and generates ready-to-run copy-paste scripts.
    2.  **User Experience:** It provides a simplified, highly aesthetic glassmorphism UI compared to complex enterprise consoles, lowering the barrier to entry for developers.

---

## Group 2: Architecture & Flow

### 4. Walk me through the end-to-end flow — from AWS account connection to risk score displayed on the dashboard.
*   **Answer**:
    1.  The user enters read-only IAM access keys in the backend `.env`.
    2.  When a scan is triggered (`POST /api/scan`), the **Scanner Ingestion Engine** instantiates AWS SDK v3 clients (S3, EC2, IAM) and fetches configuration metadata.
    3.  This metadata is mapped to Mongoose schemas and stored in the MongoDB `resources` collection.
    4.  The **Rule Engine** parses these resources against defined policies (e.g., checks if `status: "public"` for S3).
    5.  Any violation is logged as an active finding in the `findings` collection.
    6.  The **Scoring Engine** sums the deductions (Critical = -20, High = -10, etc.) and updates the active `securityScore`.
    7.  The React frontend polls `/api/dashboard`, receives the aggregated scores, and updates the Chart.js widgets.

### 5. How does your app authenticate with a user's AWS account? What IAM permissions does it need, and how do you avoid asking for more access than necessary?
*   **Answer**: The app authenticates programmatically using an **IAM User Access Key ID** and **Secret Access Key** loaded through environment variables. Adhering to the **Principle of Least Privilege**, it requires only the AWS managed policy **`ReadOnlyAccess`**. This allows the scanner to run APIs like `DescribeInstances` or `ListBuckets` to audit configurations but blocks any write, edit, or delete actions, ensuring the cloud environment remains safe.

### 6. What does your system architecture look like (frontend, backend, database, external APIs)? Can you draw it?
*   **Answer**: It is a full-stack **MERN (React, Node, Express, MongoDB)** application organized under an MVC pattern:
    *   **Frontend (Client):** Vite React client, Tailwind styling, React Router, and Axios.
    *   **Backend (API Server):** Node.js Express server running middlewares (JWT, logger, CORS).
    *   **Database:** MongoDB instance managing collections (Users, Resources, Findings, Scans).
    *   **External APIs:** AWS SDK v3 (Ingestion) and Google Gemini API (AI explanations).

```
[React Dashboard] <--> [Express API Router] <--> [Mongoose Models] <--> [MongoDB]
                              |
                     [AWS SDK v3 & Gemini API]
```

### 7. Why did you choose MongoDB over a relational database for this use case?
*   **Answer**: Cloud resources are **highly polymorphic and semi-structured**. An S3 bucket has totally different metadata fields (bucket policy, encryption settings) than an IAM user (password age, MFA enabled) or an EC2 instance (instance type, VPC ID). Using a NoSQL document database like MongoDB allows us to store diverse resource metadata dynamically in a single `resources` collection using Mongoose's flexible schema mapping, avoiding complex SQL tables and joins.

### 8. How is data structured in your Mongoose schemas for S3, EC2, IAM, SGs, CloudTrail?
*   **Answer**: We use a unified **Resource Model** with common indexing properties (`name`, `service`, `type`, `arn`, `accountId`, `region`, `status`) and a dynamic `tags` Map. Detailed configs and rule results are logged in a separate **Finding Model** referencing the resource ID (`resourceId`), which links specific security vulnerabilities back to their parent resources.

---

## Group 3: Audit & Scoring Engine

### 9. How does the rules engine decide something is "misconfigured"? Can you give a concrete example (e.g., an S3 bucket check)?
*   **Answer**: The rules engine compares database configurations against target parameters. For S3:
    *   It checks the `PublicAccessBlock` configuration. If `BlockPublicAcls` is `false` or a bucket policy has `Effect: "Allow"` with `Principal: "*"`, the rule engine flags a violation, logs an active finding, and sets the severity status to `Critical`.

### 10. Explain your weighted scoring algorithm — why 20/10/2 points for critical/important/minor issues? How did you decide these weights?
*   **Answer**: We implement a deduction-based model starting at `100`:
    *   **Critical (-20):** Direct, immediate threat (e.g. public S3 bucket or open SSH port).
    *   **High (-10):** Severe exposure (e.g. disabled CloudTrail logging).
    *   **Medium (-5):** Compliance gap (e.g. console user without MFA).
    *   **Low (-2):** Minor drift (e.g. old access keys).
    *   These weights align with standard industrial security practices (similar to CVSS scoring values) to ensure critical items dominate the posture indicator, encouraging DevSecOps teams to prioritize them first.

### 11. What are CIS AWS Benchmarks, and which specific ones did you implement?
*   **Answer**: The Center for Internet Security (CIS) AWS Foundations Benchmark is a set of industry-consensus security guidelines. We implemented critical controls:
    *   **Identity (1.x):** Requiring MFA for root/IAM users and flagging inactive credentials.
    *   **Logging (2.x):** Checking if CloudTrail is enabled and logging is active.
    *   **Networking (4.x):** Flagging security groups allowing public ingress `0.0.0.0/0` on port 22 (SSH) or 3389 (RDP).

### 12. How do you handle false positives in the audit?
*   **Answer**: We support finding state transitions in our **Finding Schema** (`Active`, `Resolved`, `Suppressed`). If a security analyst reviews a finding (e.g., a public S3 bucket designed to host public static assets) and confirms it is intentional, they can toggle the status to `Suppressed`. This removes the item from score calculations and hides it from primary dashboard tables.

---

## Group 4: GenAI Assistant

### 13. How is the Gemini Pro API integrated — what prompt/data do you send it, and what do you do with its response?
*   **Answer**: We send a structured system prompt to the Gemini API containing the specific finding document details:
    *   *Prompt:* "Analyze this cloud security finding: {title, description, severity, resource ARN, compliance mapping}. Explain the risk in plain English and provide the exact AWS CLI v2 command block to remediate it."
    *   *Response:* We parse the generated markdown response and display it directly on the frontend dashboard next to the vulnerability card.

### 14. How do you ensure the AI's suggested "CLI fixes" are safe and correct before showing them to a user?
*   **Answer**: We mitigate AI hallucination through **Prompt Engineering constraints**:
    1.  The system prompt forces Gemini to only return standard AWS CLI commands (e.g., `aws s3api put-public-access-block`).
    2.  We explicitly restrict the AI from writing customized bash/python scripts.
    3.  We display a warning in the UI reminding analysts that remediation commands must be audited in staging environments first.

### 15. What happens if the Gemini API is down or slow — is there a fallback?
*   **Answer**: Yes. If the Gemini API request fails or times out, the backend controller intercepts the exception and returns the static `recommendation` text stored locally in our database `Finding` schema (which we populate during scanner audits). This ensures that the user always receives a valid, developer-approved fix guide.

---

## Group 5: Auth, Security & DevOps

### 16. Why JWT over session-based auth? How do you handle token expiry/refresh?
*   **Answer**: JWT is **stateless and scalable**. The server does not need to store active sessions in database memory; it simply verifies the signature. We configure token expiration to `30 days` using the `expiresIn` parameter in `jwt.sign()`. For a production setup, we would implement short-lived Access Tokens (e.g. 15 mins) and long-lived Refresh Tokens stored in secure HTTP-only cookies.

### 17. Why bcrypt for password hashing — what's the difference vs plain hashing?
*   **Answer**: Plain hashing algorithms (like MD5 or SHA-256) are fast. Attackers can compute millions of combinations per second to crack passwords. Bcrypt uses a **work factor (rounds)** that intentionally delays calculations, making brute-force cracking attempts too slow and expensive to execute.

### 18. What does your RBAC model look like — what roles exist and what can each do?
*   **Answer**: We configure three authorization roles:
    *   **Admin:** Full access to view dashboards, configure cloud access keys, suppress findings, and trigger scans.
    *   **Security Analyst:** Can view dashboards, write remediation guides, and trigger scanning.
    *   **Viewer:** Read-only access to charts, tables, and settings. Cannot trigger manual scans or modify database properties.

### 19. Why did you containerize with Docker/Docker Compose — what problem does it solve for you?
*   **Answer**: Containerization solves the **"works on my machine"** bug. It packages the Node.js API runtime environment, the React Vite server, and the MongoDB engine into lightweight, isolated containers. This ensures that the application runs identically on any local developer system, staging server, or production environment without manual package installs.

### 20. If a hacker got read-only access to your database, what's the worst they could see or do?
*   **Answer**: Since the database is read-only, they cannot alter resources. However, they could see:
    1.  The names, emails, and bcrypt-hashed passwords of local users.
    2.  The metadata inventory of your cloud environment, showing IP addresses, resource names, and open security group ports.
    *   *Mitigation:* Access keys are stored in backend `.env` files (which are never saved in the database) preventing them from accessing your actual AWS account.

---

## Group 6: Challenges & Ownership

### 21. What was the hardest technical problem you faced building this, and how did you solve it?
*   **Answer**: Implementing the **asynchronous scanner logic** while preventing API rate limiting (throttling) from AWS was a key challenge. We solved this by using batch queues and promise limits to stagger client scanner queries. We also resolved state loading lag on the frontend during scan loops by using async/await structures in the React AuthContext.

### 22. What would you do differently if you rebuilt this from scratch?
*   **Answer**: I would implement **event-driven scanning** using AWS EventBridge and SNS triggers. Instead of polling APIs periodically (which is resource-intensive), we would catch configuration change events in real time to update findings instantly.

### 23. What's left to finish since it's marked "Ongoing" on your resume?
*   **Answer**: We are currently finalizing the live AWS SDK v3 scanner integration and building the custom compliance mapping widgets. We will follow up by writing the PDFKit report download utilities, node-cron automated scan schedulers, and packing services inside Docker containers.
