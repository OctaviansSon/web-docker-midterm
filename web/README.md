# DevOps Study Planner — Web

React + TypeScript + Vite frontend for the Study Planner API (team boards, members, statistics, command cheatsheet).

## Features
- Register / log in (JWT in `localStorage`, session restored after reload, automatic logout on 401)
- Teams: list, create; owner can rename, invite by e-mail, remove members, delete the team; members can leave
- **Kanban board**: Backlog → In progress → Done, drag & drop between columns (optimistic update with rollback), create / edit / delete tasks in a modal, search and filters by topic / priority / assignee (applied by the API)
- Stats: overall progress, pipeline counters, certification goals (AWS SAA, CKA, Terraform Associate), tasks by topic and by member
- Command cheatsheet: search, topic filter, copy to clipboard
- Dark / light theme, responsive layout (columns scroll horizontally on phones), toasts, loading / empty / error states

## Run (development)
Needs Node 20+ and the API running on `localhost:8000` (`docker compose up` in the parent folder).
```bash
cd web
npm install
npm run dev          # http://localhost:5173  (requests to /api are proxied to localhost:8000)
```

## Run (Docker)
From the repository root:
```bash
docker compose --profile web up --build
```
Web UI: http://localhost:3000 · API: http://localhost:8000/docs. The `web` container (nginx) serves the built app and proxies `/api` to the `api` service.

## Tests and build
```bash
npm test             # 13 tests: API client, helpers, login → teams → board → create task → stats
npm run build        # type-check + production build into dist/
```

## Structure
```
src/api/         client.ts (fetch wrapper), api.ts (all endpoints), types.ts
src/auth/        AuthContext (login, register, logout, session restore)
src/components/  Topbar, Modal, Toast, TaskCard (draggable), TaskModal, ui (Avatar, ProgressBar, states)
src/pages/       Login/Register, Teams, TeamLayout (tabs), Board, Members, Stats, Cheats
src/data/        meta.ts (topics, colors, helpers), cheatsheet.ts
src/styles.css   design tokens (same palette as the Android app) and components
```
