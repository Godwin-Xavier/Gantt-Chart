# Project Tracker Tutorial Guide

## 1) First time experience

When a user opens the tracker for the first time, a **welcome banner** appears automatically.

From this banner, users can:

- Start the full guided tutorial
- Skip the tutorial and start planning immediately

The tutorial can always be restarted later from the **Guide** button in the header.

## 2) Guided tutorial flow

The in-app tutorial walks users through the main workflow step by step:

1. Rename the project title
2. Optional sign-in with Gmail/GitHub for cross-device sync
3. Switch or add multiple projects
4. Review the connected dashboard summary
5. Add top-level tasks (phases)
6. Update task and subtask statuses
7. Edit duration, dates, colors, and optional costs
8. Open **Modify Graph** for timeline toggles and export formats
9. Open **Settings & Branding** to upload logos and manage holidays
10. Review timeline bars and totals
11. Import existing plans from JSON

Each step highlights the target area and keeps controls interactive so users can learn by doing.

## 3) Core planning actions

### Add and structure work

- Use **Add Task** for main project phases
- Expand each task and use **Add Sub-task** for detailed activities

### Schedule controls

- Duration fields use **business days**
- Holidays can be added in **Settings & Branding** and are excluded from day counts

### Visual controls

From **Modify Graph**, users can toggle:

- Dates
- Quarter view
- Totals
- Cost view

### Export and import

Export options:

- PNG
- JPEG
- PDF
- JSON (data backup)

Use **Import** to load a JSON backup and continue the same plan.

## 4) Mobile and tablet usage

The app is optimized for Android, iPhone, and tablets:

- Header controls are horizontally scrollable on small screens
- Large editor and timeline sections support horizontal scrolling for full visibility
- Settings panel adapts to a mobile-friendly bottom sheet layout
- Logo resize handles support touch and pointer input

## 5) Data persistence

Workspace data is automatically saved in browser local storage, including:

- Tasks and subtasks
- Dates, colors, costs
- Holidays
- Branding logos
- Display preferences

Users can still export JSON for backup or transfer.

## 6) Optional cloud sync (Gmail / GitHub)

The app supports optional sign-in for users who want one shared workspace across multiple devices.

- If a user stays in guest mode, local auto-save continues to work on that device.
- If a user signs in with Gmail or GitHub, their workspace is synced to the cloud.
- Each signed-in account has isolated data (multi-tenant): users only see their own workspace.

Required environment variables for deployment:

- `DATABASE_URL` (Neon Postgres)
- `AUTH_SECRET` (long random secret)
- `APP_URL` (production app URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
