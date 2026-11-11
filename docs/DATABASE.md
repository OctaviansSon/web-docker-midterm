# Database and architecture diagrams

All diagrams are written in [Mermaid](https://mermaid.js.org/) and are rendered automatically by GitHub.
PlantUML versions of the class and sequence diagrams are in [`diagrams/`](diagrams/).

## 1. Entity-relationship diagram (PostgreSQL tables)

```mermaid
erDiagram
    USERS ||--o{ TEAM_MEMBERS : "is member via"
    TEAMS ||--o{ TEAM_MEMBERS : "has members"
    TEAMS ||--o{ TASKS : "contains"
    USERS ||--o{ TEAMS : "owns"
    USERS |o--o{ TASKS : "is assignee of"
    USERS ||--o{ TASKS : "created"

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        datetime created_at
    }
    TEAMS {
        int id PK
        string name
        text description
        int owner_id FK
        datetime created_at
    }
    TEAM_MEMBERS {
        int team_id PK, FK
        int user_id PK, FK
        string role "owner or member"
        datetime joined_at
    }
    TASKS {
        int id PK
        int team_id FK
        string title
        text description
        string category
        string priority
        string status "backlog, in_progress, done"
        date due_date "nullable"
        int assignee_id FK "nullable"
        int created_by_id FK
        datetime created_at
        datetime updated_at
    }
```

| Relationship | Type | Implementation |
|---|---|---|
| Team → Task | **one-to-many** | `tasks.team_id` FK; deleting a team deletes its tasks (ORM cascade) |
| Team → TeamMember | **one-to-many** | `team_members.team_id` FK; deleting a team deletes memberships |
| User ↔ Team | **many-to-many** | association table `team_members` (composite PK `team_id` + `user_id`) with an extra column `role` |
| User → Team (owner) | one-to-many | `teams.owner_id` FK |
| User → Task (assignee) | one-to-many, optional | `tasks.assignee_id` FK, nullable; removing a member sets it to `NULL` |
| User → Task (creator) | one-to-many | `tasks.created_by_id` FK |

## 2. Class diagram (SQLAlchemy models)

```mermaid
classDiagram
    class User {
        +int id
        +str username
        +str email
        +str password_hash
        +datetime created_at
    }
    class Team {
        +int id
        +str name
        +str description
        +int owner_id
        +datetime created_at
    }
    class TeamMember {
        +int team_id
        +int user_id
        +str role
        +datetime joined_at
    }
    class Task {
        +int id
        +int team_id
        +str title
        +str description
        +str category
        +str priority
        +str status
        +date due_date
        +int assignee_id
        +int created_by_id
        +datetime created_at
        +datetime updated_at
    }
    User "1" --> "0..*" Team : owns
    Team "1" *-- "1..*" TeamMember : members
    User "1" --> "0..*" TeamMember : memberships
    Team "1" *-- "0..*" Task : tasks
    User "0..1" <-- "0..*" Task : assignee
```

## 3. Sequence diagram (typical usage)

```mermaid
sequenceDiagram
    actor Client as Postman / Web / Android
    participant API as FastAPI (api container)
    participant DB as PostgreSQL (db container)

    Client->>API: POST /api/auth/register
    API->>DB: INSERT user (password hashed)
    API-->>Client: 201 user
    Client->>API: POST /api/auth/login
    API->>DB: SELECT user by email
    API-->>Client: 200 access_token (JWT)

    Note over Client,API: next requests send Authorization: Bearer token

    Client->>API: POST /api/teams
    API->>DB: INSERT team + member(role=owner)
    API-->>Client: 201 team
    Client->>API: POST /api/teams/{id}/members
    API->>DB: INSERT member(role=member)
    API-->>Client: 201 member
    Client->>API: POST /api/teams/{id}/tasks
    API->>DB: check membership, INSERT task
    API-->>Client: 201 task
    Client->>API: PATCH /api/tasks/{id}/status
    API->>DB: UPDATE task status
    API-->>Client: 200 task
```

## 4. Deployment diagram (Docker Compose)

```mermaid
flowchart LR
    client["Postman / Browser / Android app"] -->|"HTTP :8000"| api
    subgraph compose ["Docker Compose project: devops-planner"]
        subgraph net ["network: backend"]
            api["api container<br/>FastAPI + uvicorn"] -->|"db:5432"| db["db container<br/>PostgreSQL 16"]
            web["web container (profile web)<br/>nginx + React"] -->|"api:8000"| api
        end
        db --- vol[("named volume<br/>pgdata")]
    end
    env[".env"] -.-> api
    env -.-> db
```

## Business rules enforced by the API
- Only team members can read or change the team's tasks (otherwise `403`).
- Only the team owner can rename or delete the team and add or remove members (otherwise `403`).
- The owner cannot be removed from the team (`400`).
- An assignee must be a member of the team (`422`).
- E-mail and username are unique (`409`); passwords are stored only as salted PBKDF2 hashes.
