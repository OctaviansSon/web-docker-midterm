# API documentation

Base URL: `http://localhost:8000` · Interactive docs (Swagger UI): `http://localhost:8000/docs` · OpenAPI JSON: `/openapi.json`

All bodies are JSON. Protected endpoints need the header `Authorization: Bearer <access_token>` (get the token from `POST /api/auth/login`).

## Errors
| Code | Meaning |
|---|---|
| 400 | Business rule violated (e.g. the owner tries to leave the team) |
| 401 | Missing / invalid / expired token, or wrong login |
| 403 | Authenticated, but not a member / not the owner of the team |
| 404 | Resource does not exist |
| 409 | Conflict (duplicate e-mail, username or team member) |
| 422 | Validation error (bad field, unknown enum value, assignee not in team) |

Error body: `{"detail": "message"}` (validation errors: `{"detail": [ ... ]}`).

## Enums
- `category`: `linux`, `networking`, `docker`, `kubernetes`, `cicd`, `aws`, `terraform`, `monitoring`, `devsecops`, `other`
- `priority`: `low`, `medium`, `high`
- `status` (pipeline stage): `backlog`, `in_progress`, `done`

## System
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Liveness + DB check → `{"status":"ok","database":"up"}` |

## Auth
| Method | Path | Auth | Success | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | 201 | Create an account |
| POST | `/api/auth/login` | – | 200 | Get a JWT |
| GET | `/api/auth/me` | ✔ | 200 | Current user |

**Register** — body: `{"username": "dior", "email": "dior@example.com", "password": "secret123"}` (username 3–32 chars, password ≥ 6)
→ `201 {"id": 1, "username": "dior", "email": "dior@example.com", "created_at": "..."}`. Errors: 409, 422.

**Login** — body: `{"email": "dior@example.com", "password": "secret123"}`
→ `200 {"access_token": "<jwt>", "token_type": "bearer"}`. Error: 401.

## Teams (resource 1)
A team is a shared board. The creator becomes its **owner**; added users are **members**.

| Method | Path | Who | Success | Description |
|---|---|---|---|---|
| GET | `/api/teams` | any user | 200 | **List** teams I belong to |
| POST | `/api/teams` | any user | 201 | **Create** a team |
| GET | `/api/teams/{team_id}` | member | 200 | **Get by ID** (with members) |
| PUT | `/api/teams/{team_id}` | owner | 200 | **Update** name / description |
| DELETE | `/api/teams/{team_id}` | owner | 204 | **Delete** team with its tasks |
| POST | `/api/teams/{team_id}/members` | owner | 201 | Add a registered user by e-mail |
| DELETE | `/api/teams/{team_id}/members/{user_id}` | owner, or the user himself | 204 | Remove / leave (owner cannot be removed) |

Create body: `{"name": "CKA study group", "description": "optional"}`
Team response: `{"id", "name", "description", "owner_id", "created_at", "members_count", "my_role"}`; `GET /teams/{id}` also returns `members: [{"user_id","username","email","role","joined_at"}]` and `tasks_count`.
Add member body: `{"email": "teammate@example.com"}`. Errors: 403, 404 (no such user), 409 (already a member).

## Tasks (resource 2, the cards of the board)
| Method | Path | Who | Success | Description |
|---|---|---|---|---|
| GET | `/api/teams/{team_id}/tasks` | member | 200 | **List** tasks, with filters |
| POST | `/api/teams/{team_id}/tasks` | member | 201 | **Create** a task |
| GET | `/api/tasks/{task_id}` | member of its team | 200 | **Get by ID** |
| PUT | `/api/tasks/{task_id}` | member | 200 | **Update** (only sent fields change) |
| PATCH | `/api/tasks/{task_id}/status` | member | 200 | Move to another stage (drag & drop) |
| DELETE | `/api/tasks/{task_id}` | member | 204 | **Delete** |

List query parameters (all optional): `status`, `category`, `priority`, `assignee_id`, `q` (search in title/description).
Example: `GET /api/teams/1/tasks?category=aws&priority=high`

Create body:
```json
{
  "title": "Design a VPC",
  "description": "CIDR, route tables, NAT gateway",
  "category": "aws",
  "priority": "high",
  "status": "backlog",
  "due_date": "2030-12-31",
  "assignee_id": 2
}
```
Only `title` is required. `assignee_id` must be a member of the team (otherwise 422).
Task response: `{"id","team_id","title","description","category","priority","status","due_date","assignee_id","created_by_id","created_at","updated_at"}`.
Update: any subset of the create fields; send `"due_date": null` or `"assignee_id": null` to clear them.
Status body: `{"status": "done"}`.

## Statistics
| Method | Path | Who | Success | Description |
|---|---|---|---|---|
| GET | `/api/teams/{team_id}/stats` | member | 200 | Board summary |

Response:
```json
{
  "team_id": 1,
  "total_tasks": 2, "done_tasks": 1, "progress_percent": 50.0, "overdue_tasks": 0,
  "by_status": {"backlog": 0, "in_progress": 1, "done": 1},
  "by_category": {"aws": 1, "kubernetes": 1, "...": 0},
  "certifications": [{"name": "CKA", "done": 0, "total": 1, "progress_percent": 0.0}],
  "by_member": [{"user_id": 1, "username": "dior", "assigned": 1, "done": 1}]
}
```
Certification topics: AWS SAA = aws + networking + devsecops · CKA = kubernetes + linux + docker · Terraform Associate = terraform + cicd.
