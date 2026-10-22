from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db, get_team_as_member

router = APIRouter(tags=["Tasks"])


def _check_assignee(db: Session, team_id: int, assignee_id: int | None) -> None:
    if assignee_id is not None and db.get(models.TeamMember, (team_id, assignee_id)) is None:
        raise HTTPException(422, "assignee_id must be a member of the team")


def _get_task(db: Session, task_id: int, user: models.User) -> models.Task:
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Task not found")
    get_team_as_member(db, task.team_id, user)  # 403 if the user is not in the task's team
    return task


@router.get("/teams/{team_id}/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    team_id: int,
    status_filter: schemas.Status | None = Query(default=None, alias="status"),
    category: schemas.Category | None = None,
    priority: schemas.Priority | None = None,
    assignee_id: int | None = None,
    q: str | None = Query(default=None, description="Search in title and description"),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    get_team_as_member(db, team_id, user)
    stmt = select(models.Task).where(models.Task.team_id == team_id)
    if status_filter:
        stmt = stmt.where(models.Task.status == status_filter.value)
    if category:
        stmt = stmt.where(models.Task.category == category.value)
    if priority:
        stmt = stmt.where(models.Task.priority == priority.value)
    if assignee_id is not None:
        stmt = stmt.where(models.Task.assignee_id == assignee_id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(models.Task.title.ilike(like) | models.Task.description.ilike(like))
    return db.scalars(stmt.order_by(models.Task.id)).all()


@router.post("/teams/{team_id}/tasks", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    team_id: int,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    get_team_as_member(db, team_id, user)
    _check_assignee(db, team_id, payload.assignee_id)
    task = models.Task(
        team_id=team_id,
        title=payload.title.strip(),
        description=payload.description,
        category=payload.category.value,
        priority=payload.priority.value,
        status=payload.status.value,
        due_date=payload.due_date,
        assignee_id=payload.assignee_id,
        created_by_id=user.id,
    )
    db.add(task)
    db.commit()
    return task


@router.get("/tasks/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return _get_task(db, task_id, user)


@router.put("/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    task = _get_task(db, task_id, user)
    data = payload.model_dump(exclude_unset=True)
    for key in ("title", "category", "priority", "status"):
        value = data.get(key)
        if value is not None:
            setattr(task, key, value.value if isinstance(value, Enum) else value.strip() if key == "title" else value)
    if data.get("description") is not None:
        task.description = data["description"]
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "assignee_id" in data:
        _check_assignee(db, task.team_id, data["assignee_id"])
        task.assignee_id = data["assignee_id"]
    db.commit()
    return task


@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskOut)
def update_task_status(
    task_id: int,
    payload: schemas.TaskStatusUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    task = _get_task(db, task_id, user)
    task.status = payload.status.value
    db.commit()
    return task


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    task = _get_task(db, task_id, user)
    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
