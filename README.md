# DevOps Study Planner — API (Docker Midterm, Part 1)

Containerized REST backend for a team-based DevOps study planner (Trello-like). Users register, create **teams**,
invite teammates and manage a board of **tasks** (Backlog → In progress → Done) with DevOps topics
(Docker, Kubernetes, AWS, Terraform, ...). The API also returns progress towards **AWS SAA / CKA / Terraform Associate**.
It is the backend for the "DevOps Study Planner" Android app and for the optional web frontend in `web/`; everything is testable through Postman.

## Stack
FastAPI (Python 3.12) · SQLAlchemy · PostgreSQL 16 · JWT auth · Docker · Docker Compose

## Architecture
```
 Postman / browser ──HTTP :8000──▶ [ api container ] ──network "backend"──▶ [ db container ]
                                    FastAPI + uvicorn      DNS name "db"      PostgreSQL 16
                                                                                  │
                                                                     named volume "pgdata"
```
- **api** — built from the custom `Dockerfile` (python:3.12-slim, non-root user, layer-cached dependencies, HEALTHCHECK).
- **db** — official `postgres:16-alpine`; port is *not* published, only the API can reach it through the `backend` network.
- **pgdata** — named volume with the database files, data survives `docker compose down` (removed only by `down -v`).
- **Configuration** — environment variables from `.env` (DB credentials, JWT secret, API port).

```
app/            FastAPI application (main, config, database, models, schemas, security, deps)
app/routers/    auth.py · teams.py · tasks.py · stats.py
tests/          pytest tests (SQLite, no Docker needed)
postman/        exported Postman collection (35 requests, 54 assertions)
docs/API.md     API documentation of all endpoints
web/            React frontend (optional, Docker profile `web`)
Dockerfile · docker-compose.yml · .env.example
```

## Run
Requirements: Docker Desktop (or Docker Engine + Compose v2).
```bash
cp .env.example .env        # Windows PowerShell: copy .env.example .env   (then edit secrets)
docker compose up --build
```
When the log shows `Uvicorn running on http://0.0.0.0:8000`:
- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/health

Useful commands:
```bash
docker compose ps                         # status (api becomes "healthy")
docker compose logs -f api                # API logs
docker compose exec db psql -U planner -d planner -c "\dt"      # look into the database
docker compose down                       # stop, keep data
docker compose down -v                    # stop and DELETE the database volume
```

## Web frontend (optional)
A complete React web UI lives in [`web/`](web/README.md) (login, teams, drag & drop board, members, stats, cheatsheet).
It is **not** part of the default `docker compose up`, so the required stack (db + api) always starts on its own. To run everything including the web UI:
```bash
docker compose --profile web up --build     # UI: http://localhost:3000
```

## Test with Postman
1. Postman → **Import** → `postman/DevOps-Planner.postman_collection.json`.
2. Open the collection → **Run** → keep the order → **Run DevOps Study Planner API**.
   The collection registers two users, logs in (tokens are stored in collection variables), creates a team, adds a member,
   creates / filters / updates / deletes tasks, reads statistics and checks error cases (401, 403, 404, 409, 422).
   Expected result: **35 requests passed**.
3. Base URL is the collection variable `baseUrl` (default `http://localhost:8000`).

## Unit tests (optional, without Docker)
```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pytest -q
```

## API overview
Full description with request/response examples: [docs/API.md](docs/API.md)

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| Teams | `GET/POST /api/teams` · `GET/PUT/DELETE /api/teams/{id}` · `POST /api/teams/{id}/members` · `DELETE /api/teams/{id}/members/{user_id}` |
| Tasks | `GET/POST /api/teams/{id}/tasks` · `GET/PUT/DELETE /api/tasks/{id}` · `PATCH /api/tasks/{id}/status` |
| Stats | `GET /api/teams/{id}/stats` |
| System | `GET /health` |

## Environment variables
| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | db, api | Database credentials and name |
| `JWT_SECRET` | api | Secret for signing tokens (change it!) |
| `JWT_EXPIRE_MINUTES` | api | Token lifetime, default 1440 |
| `API_PORT` | compose | Host port for the API, default 8000 |
| `WEB_PORT` | compose | Host port for the optional web UI, default 3000 |
| `CORS_ORIGINS` | api | Allowed web origins, `*` by default |
