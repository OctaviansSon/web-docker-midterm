from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class Category(str, Enum):
    linux = "linux"
    networking = "networking"
    docker = "docker"
    kubernetes = "kubernetes"
    cicd = "cicd"
    aws = "aws"
    terraform = "terraform"
    monitoring = "monitoring"
    devsecops = "devsecops"
    other = "other"


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class Status(str, Enum):
    backlog = "backlog"
    in_progress = "in_progress"
    done = "done"


# ---------- auth ----------
class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32, examples=["dior"])
    email: str = Field(pattern=EMAIL_PATTERN, max_length=255, examples=["dior@example.com"])
    password: str = Field(min_length=6, max_length=128, examples=["secret123"])


class UserLogin(BaseModel):
    email: str = Field(examples=["dior@example.com"])
    password: str = Field(examples=["secret123"])


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- teams ----------
class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["CKA study group"])
    description: str = Field(default="", max_length=2000)


class TeamUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class TeamOut(BaseModel):
    id: int
    name: str
    description: str
    owner_id: int
    created_at: datetime
    members_count: int
    my_role: str


class MemberOut(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    joined_at: datetime


class TeamDetail(TeamOut):
    members: list[MemberOut]
    tasks_count: int


class MemberAdd(BaseModel):
    email: str = Field(pattern=EMAIL_PATTERN, examples=["teammate@example.com"])


# ---------- tasks ----------
class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200, examples=["Design a VPC"])
    description: str = Field(default="", max_length=5000)
    category: Category = Category.other
    priority: Priority = Priority.medium
    status: Status = Status.backlog
    due_date: date | None = None
    assignee_id: int | None = None


class TaskUpdate(BaseModel):
    """Only the fields that are sent are changed. due_date / assignee_id accept null to clear."""
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    category: Category | None = None
    priority: Priority | None = None
    status: Status | None = None
    due_date: date | None = None
    assignee_id: int | None = None


class TaskStatusUpdate(BaseModel):
    status: Status


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_id: int
    title: str
    description: str
    category: Category
    priority: Priority
    status: Status
    due_date: date | None
    assignee_id: int | None
    created_by_id: int
    created_at: datetime
    updated_at: datetime
