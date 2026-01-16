# ExamGuard - The Next Generation of Secure Assessments

**ExamGuard** is an enterprise-grade secure assessment and proctored examination platform designed for universities, certification bodies, and enterprises. Built with **Next.js (App Router)** and backed by a **PostgreSQL** relational database managed via Prisma ORM.

---

## ====Key Features====

### 1. Active Biometric & Acoustic Telemetry
- **Live Camera Stream**: Real-time biometric camera feed displayed to candidate with active targeting reticle overlay.
- **Acoustic Audio Monitoring**: Dynamic Web Audio API frequency spectrum analyzer visualizer bars detecting ambient decibel levels.
- *Privacy Compliance*: Streaming telemetry is active during testing without unnecessary recording banners.

### 2. Zero-Tolerance Anti-Cheat Perimeter
- **Enforced Locked Fullscreen**: Detects when candidate exits fullscreen and triggers instant strikes.
- **Tab-Switch & Blur Detection**: Monitors `visibilitychange` and window `blur` events.
- **Strike & Auto-Termination Engine**: Configurable violation limits (e.g., 3 strikes). Exceeding the strike threshold automatically terminates and flags the test.
- **Key & Context Restraints**: Disables right-click context menu, clipboard cut/copy/paste, and developer shortcuts (F12, DevTools).

### 3. Granular Precision Timing
- **Per-Question Countdown Timers**: Configure rapid-fire timers per MCQ (e.g., 45 seconds). Automatically auto-locks and advances to the next question on timeout.
- **Overall Assessment Timers**: Global countdown clock with visual alert states (green → yellow → pulsing red).

### 4. Dual Dedicated Portals
- **Teacher / Examiner Portal**:
  - Create and configure assessments with custom access codes (e.g. `SEC101`).
  - Configure point weights, negative marking, and passing percentages.
  - Review candidate submissions with timestamped anti-cheat violation event timelines.
- **Student / Candidate Portal**:
  - Enter unique access code to enter test room.
  - Pre-exam diagnostic checkroom (hardware camera & audio test + agreement).
  - Clean question palette (answered, flagged for review, unanswered).
  - Instant score reports with confetti celebration, percentage, and question explanations.

---

## Quick Start

### 1. Supabase Configuration
The application uses **Supabase (PostgreSQL)** through Prisma. Copy `.env.example` to `.env` and fill in the values from **Supabase Dashboard → Project Settings → Database**:

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_<key>"

# Runtime queries (Supavisor transaction pooler, IPv4)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&sslmode=require&host=<ipv4>"

# Schema push / migrations (Supavisor session pooler, IPv4)
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require&host=<ipv4>"

JWT_SECRET="<a-long-random-secret>"
TEACHER_INVITE_CODE="<optional-long-random-invite-code>"
```

> **Why two URLs?** Prisma uses `DATABASE_URL` for application queries (transaction pooling) and `DIRECT_URL` for schema changes. Supabase's direct `db.<project-ref>.supabase.co` host is IPv6-only, so the IPv4 Supavisor pooler is used for both.
>
> **Why `host=<ipv4>`?** On networks with DNS64 (common on Windows/mobile ISPs), the pooler hostname also resolves to a synthetic IPv6 address. Prisma's engine may try that address and time out. Pinning one of the pooler's IPv4 addresses with Prisma's `host` parameter avoids this. If the pooler's IP changes, refresh it with `nslookup aws-0-<region>.pooler.supabase.com` and update both URLs.

Then verify the connection and create the schema:

```bash
npm run db:check   # confirm Supabase Postgres + Auth are reachable
npm run db:push    # create/update the Prisma schema in Supabase
npm run db:seed    # insert demo users and assessments
npm run db:secure  # enable RLS + block the public Data API
```

> **Warning:** `npm run db:seed` deletes all existing users, assessments, questions, and attempts before inserting the demo data. Do not run it against a database that contains data you want to keep.

Optional: open Prisma Studio with `npm run db:studio`.

> **Security note:** Supabase exposes the `public` schema through its Data API (REST/GraphQL) to the `anon` and `authenticated` roles. Prisma creates tables without RLS, so anyone holding the publishable key could read (or write) all app tables, including password hashes. `npm run db:secure` enables RLS on every table and revokes `anon`/`authenticated` privileges. The app is unaffected because Prisma connects as `postgres`, which bypasses RLS. Run it again after `db:push` if you add new tables; the command is idempotent. If you later need the Data API, add explicit RLS policies and grants instead of re-enabling public access.

###  Security & deployment checklist

- **Never commit `.env`.** It is gitignored. Copy `.env.example` to `.env` and fill in your own values.
- **Rotate secrets before any public deploy.** The `.env.example` placeholders are not safe for production. Generate a fresh `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) and a strong database password.
- **Teacher accounts.** Public teacher self-registration is disabled unless you set `TEACHER_INVITE_CODE` in `.env`. Without it, only `STUDENT` accounts can be created via `/register`; teacher accounts must be inserted directly (e.g. via the seed).
- **Run `npm run db:secure`** after every `db:push` that adds tables, and verify the Supabase Data API returns `401` on the app tables.
- **Vendor assets.** `public/wasm/` and `public/models/` (~40 MB of vision/wasm binaries) are gitignored. They are required for camera/vision proctoring; obtain them from the project maintainer or regenerate them before running the exam room.
- **Lint.** `tsc --noEmit` and `npm run build` pass cleanly. `npm run lint` reports pre-existing style warnings in the codebase; it is not part of the build gate.

### 2. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3001](http://localhost:3001)** (or port 3000) in your browser.

---

##  Demo Credentials

| Role | Email | Password | Access / Dashboard |
|---|---|---|---|
| **Teacher / Examiner** | `teacher@proctora.edu` | `password123` | [`/teacher`](http://localhost:3001/teacher) |
| **Student / Candidate** | `student@proctora.edu` | `password123` | [`/student`](http://localhost:3001/student) |

> ** Demo only.** These credentials and the seeded assessment codes are for local development and demos. Change them before any production deploy, and do not store real candidate data in the seeded database.


### Pre-Seeded Assessment Codes
- **`SEC101`**: *Advanced Computer Networks & Security Protocols* (Overall timer mode, 5 questions, 3 strikes allowed).
- **`WEB202`**: *Full-Stack JavaScript & Modern Web Architectures* (Per-Question Timer mode: 45s per MCQ!).
