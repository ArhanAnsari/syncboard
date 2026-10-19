# SyncBoard ⚡

> Real-time collaborative shift and emergency coordinator for on-site operations, hackathons, and event teams. Built for the Appwrite Hackathon.

SyncBoard is a high-performance, real-time command dashboard designed for on-the-ground volunteer mobilization and event logistics. Powered by **Appwrite TablesDB, Realtime, Auth, and Avatars**, it provides instant task claim workflows, live volunteer presence, operational SOS alerts, and shift metrics with zero page refreshes.

---

## 🚀 Key Highlights & Capabilities

### 🔄 Real-Time Collaboration (Appwrite Realtime)
- **Live Kanban Board**: Tasks move seamlessly across columns (`open`, `in-progress`, `completed`) in lockstep across all participant screens via WebSocket event streams.
- **Volunteer Presence Heartbeats**: Visual indicator showing currently connected, active volunteers in real time.
- **Live Activity Audit Feed**: Chronological log capturing every task creation, claim, resolution, and coordinator action.

### 🚨 Incident Lifecycle & Operational SOS
- **Emergency Broadcasts**: Instant trigger for priority incidents; pushes an unmissable alert banner and audio cue to all active devices.
- **Live SOS Resolution**: Coordinators can resolve ongoing incidents, automatically dismissing banners across all clients without a reload.
- **Host Session Termination**: Creators can cleanly terminate a broadcast event, tearing down real-time connections and gracefully ejecting volunteers back to safety.

### 🔐 Authentication & Identity (Appwrite Auth)
- **Multi-Provider OAuth**: Dedicated support for Appwrite and GitHub authentication providers with custom branded vector assets.
- **Passwordless Email OTP**: Direct token creation and instant code verification flow.
- **Anonymous Sessions**: Frictionless 1-click guest access for volunteers arriving on-site.
- **Clerk-Style Profile Pill**: Header widget displaying provider badges, session status, user initials, and sign-out controls.

### 🎯 Gamification & Volunteer Tools
- **Live Volunteer Leaderboard**: Dynamic rankings displaying top contributors based on completed shifts.
- **Synthesized Web Audio Cues**: Interactive sound effects (task claims, completions, SOS sirens) synthesized client-side via the browser's Web Audio API.
- **Countdowns & Filtering**: Real-time due date countdowns with visual overdue alerts, instant text search, category filters, and a 1-click **"My Claimed Shifts"** toggle.

### 📦 Portability & Utilities
- **Dynamic QR Onboarding**: Instant event boarding via QR codes generated on the fly with the Appwrite Avatars API.
- **Post-Mortem CSV Export**: Downloadable audit spreadsheets containing full shift lists, assignees, and incident histories.
- **One-Click Demo Generator**: Pre-populates a complete event with diverse shifts across tech, catering, and logistics for instant testing.
- **Accessible Dark/Light Modes**: Complete high-contrast color theming via Tailwind CSS v4 and `next-themes`.
- **Keyboard Shortcuts**: Press `C` to create a task, `/` to focus search, and `Esc` to close modals.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────┐
│               SyncBoard Client (Next.js 16)            │
│       React 19 • Tailwind CSS v4 • Web Audio API       │
└────────────┬──────────────┬──────────────┬─────────────┘
             │              │              │
             │ Auth         │ Realtime     │ Avatars API
             ▼              ▼              ▼
┌────────────────────────────────────────────────────────┐
│                    Appwrite Cloud                      │
│                                                        │
│  [Auth Service]         [Realtime Engine]              │
│  • Appwrite & GitHub    • Task Updates                 │
│  • Email OTP            • Activity Logs                │
│  • Anonymous Sessions   • Presence Heartbeats          │
│                                                        │
│  [TablesDB]             [Avatars Service]              │
│  • events               • getInitials()                │
│  • tasks                • getQR()                      │
│  • activity_logs                                       │
└────────────────────────────────────────────────────────┘
```

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Sonner Toasts
- **Backend & Cloud**:
  - **Appwrite TablesDB**: Relational document storage and indexed queries
  - **Appwrite Realtime**: Low-latency WebSocket event pub/sub
  - **Appwrite Auth**: OAuth2, Email OTP, and Anonymous sessions
  - **Appwrite Avatars**: Dynamic avatar generation and QR rendering

---

## 🗄️ Database Schemas (Appwrite TablesDB)

The project relies on a single database named `syncboard_db` with three primary collections/tables:

### 1. `events`
| Attribute | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `code` | string (6) | Yes | Unique event access code |
| `name` | string | Yes | Event name / operation label |
| `host_id` | string | Yes | Creator user ID |
| `status` | string | No | `active` or `ended` |

### 2. `tasks`
| Attribute | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | string | Yes | Foreign relation referencing event `code` |
| `title` | string | Yes | Shift title / task overview |
| `category` | enum | Yes | `logistics`, `tech`, `catering`, `security`, `general` |
| `priority` | enum | Yes | `low`, `medium`, `high`, `critical` |
| `status` | enum | Yes | `open`, `in-progress`, `completed` |
| `assigned_to` | string | No | Volunteer user ID (null when open) |
| `assigned_name`| string | No | Volunteer display name (nullable) |
| `due_time` | datetime | No | ISO timestamp for shift deadline |

### 3. `activity_logs`
| Attribute | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | string | Yes | Reference to event `code` |
| `actor_name` | string | Yes | Name of the user performing the action |
| `action` | string | Yes | Action type or flag (`CLAIMED`, `SOS_RESOLVED`, etc.) |
| `details` | string | No | Context notes or assignment summary |
| `is_alert` | boolean | No | Set to `true` for emergency SOS broadcasts |

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- An active project on [Appwrite Cloud](https://cloud.appwrite.io/) or self-hosted Appwrite instance.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/syncboard.git
cd syncboard

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=syncboard_db
NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=events
NEXT_PUBLIC_APPWRITE_TASKS_COLLECTION_ID=tasks
NEXT_PUBLIC_APPWRITE_LOGS_COLLECTION_ID=activity_logs
```

### 4. Appwrite Console Settings
1. Navigate to **Auth $\rightarrow$ Settings**:
   - Turn **Email OTP** to **ON**.
   - Turn **Anonymous Sessions** to **ON**.
2. Navigate to **Settings $\rightarrow$ Web Platforms**:
   - Add `localhost` (and your production domain if deploying).
3. Under the `tasks` table:
   - Ensure `assigned_name` and `assigned_to` have **Required: false**.

### 5. Running the Application
```bash
# Run local dev server with Turbopack
npm run dev

# Run production build validation
npm run build
npm run start
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⌨️ Global Keyboard Navigation

| Shortcut | Context | Action |
| :---: | :--- | :--- |
| <kbd>C</kbd> | Board view | Open "Create Shift" dialog |
| <kbd>/</kbd> | Board view | Focus the task search input |
| <kbd>Esc</kbd> | Anywhere | Close active modal, dialog, or drawer |

---

## 📄 License

Distributed under the [MIT License](LICENSE). Built with ❤️ for the Appwrite Databases Hackathon.