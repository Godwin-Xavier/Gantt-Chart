# Project Tracker — User Guide

## 1) First-time experience

When a user opens the tracker for the first time, a **welcome banner** appears automatically with an animated tutorial reel.

From this banner, users can:

- Browse the feature preview reel (auto-plays across 6 key areas)
- Start the full guided tutorial step-by-step
- Skip the tutorial and begin planning immediately

The tutorial can always be restarted later from the **Guide** button in the header toolbar.

---

## 2) Guided tutorial flow

The in-app tutorial walks users through the main workflow step by step:

1. Rename the project title
2. Understand the command-center layout (workspace, navigation, planner actions)
3. Switch between projects using the project selector
4. Add a new project with Add Project
5. Delete a project safely (with confirmation guard)
6. Switch views using the Planner and Dashboard controls
7. Optional sign-in with Gmail or GitHub for cross-device cloud sync
8. Open the **Reminder Center** (bell icon) to manage alerts
9. Review the connected **Portfolio Dashboard**
10. Add top-level tasks (phases) and subtasks
11. Update task and subtask statuses
12. Edit duration, dates, colors, and optional costs
13. Open **Modify Graph** for timeline toggles and export formats
14. Open **Settings & Branding** to upload logos and manage holidays
15. Review timeline bars and totals
16. Import existing plans from JSON
17. Export the **Dashboard Snapshot** as a share-ready image

Each step highlights the target area with a visible focus ring and keeps controls interactive so users learn by doing.

---

## 3) Core planning actions

### Add and structure work

- Use **Add Task** for main project phases
- Expand each task and use **Add Sub-task** for detailed activities
- Each task supports a name, color, start/end dates, duration (business days), cost, status, and reminders

### Schedule controls

- Duration fields use **business days** by default
- Holidays can be added in **Settings & Branding** and are excluded from all day counts
- Task start/end dates cascade automatically when duration or start date changes

### Visual controls

From **Modify Graph**, users can toggle:

- Dates on timeline bars
- Quarter view for long-horizon projects
- Totals row
- Cost view

### Export and import

Export options available from Modify Graph:

- PNG — high-resolution image for presentations
- JPEG — compressed image for email sharing
- PDF — document-ready export
- JSON — full data backup for restore

Use **Import** to load a JSON backup and continue an existing plan on any device.

---

## 4) Reminder Center

The Reminder Center is accessed by clicking the **bell icon** in the Navigation + Sync panel of the command center.

### What it shows

The panel opens as a sleek dropdown with three main sections:

- **Stats row** — three quick-glance cards: Upcoming, Due Today, and Live Alerts
- **Next Scheduled** — the nearest upcoming reminder with date, time, and task name
- **Preferences** — settings for browser notifications, reminder sound, and tab title flashing
- **Upcoming Reminders** — a scrollable list of scheduled reminders (up to 7 shown) with delete controls
- **Recent Alerts** — a live feed of fired notifications tagged as Manual or Auto, with dismiss controls

### Setting reminders

- Open any task or subtask row editor and use **Set Reminder** to schedule a date + time alert
- Reminders fire at the exact scheduled window — missed times are skipped automatically to prevent alert pile-up

### Preferences

| Setting | Description |
|---|---|
| Browser Notifications | Shows system-level alerts when the tab is in the background (requires browser permission) |
| Reminder Sound | Plays an audio cue when a reminder fires |
| Tab Title Flashing | Flashes the browser tab title with the alert text |

Both sound and tab flash are controlled by enterprise-grade toggle switches in the Preferences section.

---

## 5) Portfolio Dashboard

Switch to **Dashboard** mode by clicking the Dashboard button in the left command rail (vertical layout) or in the command-panel tabs.

### What the dashboard shows

- **Stats bar** — Overall completion %, total project count, completed projects, and in-progress projects
- **Donut chart** — Visual ring showing portfolio-wide completion with task counts
- **Filter tabs** — Filter task lists across all projects by All / Completed / Pending
- **Project cards** — Expandable cards for each project with a live progress bar, task breakdown, and quick Open button

### Progress bar colors

The progress bar on each project card reflects health:

- Gray — 0–29% complete
- Amber — 30–59% complete
- Indigo — 60–99% complete
- Green — 100% complete

### Download Snapshot

Click **Download Snapshot** from the dashboard header to export a full portfolio summary as a single PNG image. The snapshot includes all projects, tasks, subtasks, statuses, and timelines in a print-ready format.

---

## 6) Mobile and tablet usage

The app is fully optimized for Android, iPhone, and tablets:

- Header controls collapse into grouped command blocks for mobile/tablet
- Task and subtask rows prioritize readable name fields with touch-friendly status and duration controls
- On phones, timeline cards include inline status selectors for direct updates in the graph
- Large editor and timeline sections support horizontal scrolling for full visibility
- Settings panel adapts to a mobile-friendly bottom sheet layout
- Logo resize handles support touch and pointer input
- Reminder Center panel adapts to full-width on small screens

---

## 7) Data persistence

Workspace data is automatically saved in browser local storage, including:

- Tasks and subtasks with all fields
- Dates, colors, costs
- Holidays
- Branding logos
- Display preferences
- Reminder schedules and notification preferences

Users can export JSON at any time for backup or device transfer.

---

## 8) Optional cloud sync (Gmail / GitHub)

The app supports optional sign-in for users who want one shared workspace across multiple devices.

- Guest mode: local auto-save continues to work on that device
- Signed-in mode: workspace syncs to the cloud on every save, with a sync indicator in the header

Each signed-in account has isolated data (multi-tenant) — users only see their own workspace.

Required environment variables for deployment:

- `DATABASE_URL` (Neon Postgres)
- `AUTH_SECRET` (long random secret)
- `APP_URL` (production app URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

---

## 9) Vercel production deployment

- Production automatically deploys when a new commit is pushed to `main`
- If GitHub is up to date but Vercel has not refreshed, open **Deployments** in Vercel and click **Redeploy** on the latest commit
- Environment variables must be set in the Vercel project settings before the first deployment
