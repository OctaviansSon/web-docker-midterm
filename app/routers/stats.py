from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db, get_team_as_member

router = APIRouter(tags=["Stats"])

# Same certification goals as the Android app.
CERTIFICATIONS = {
    "AWS SAA": {"aws", "networking", "devsecops"},
    "CKA": {"kubernetes", "linux", "docker"},
    "Terraform Associate": {"terraform", "cicd"},
}


def _percent(done: int, total: int) -> float:
    return round(done / total * 100, 1) if total else 0.0


@router.get("/teams/{team_id}/stats")
def team_stats(team_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    team, _ = get_team_as_member(db, team_id, user)
    tasks = team.tasks
    total = len(tasks)
    done = sum(t.status == "done" for t in tasks)
    today = date.today()

    return {
        "team_id": team.id,
        "total_tasks": total,
        "done_tasks": done,
        "progress_percent": _percent(done, total),
        "overdue_tasks": sum(1 for t in tasks if t.due_date and t.due_date < today and t.status != "done"),
        "by_status": {s.value: sum(t.status == s.value for t in tasks) for s in schemas.Status},
        "by_category": {c.value: sum(t.category == c.value for t in tasks) for c in schemas.Category},
        "certifications": [
            {
                "name": name,
                "done": sum(1 for t in tasks if t.category in topics and t.status == "done"),
                "total": sum(1 for t in tasks if t.category in topics),
                "progress_percent": _percent(
                    sum(1 for t in tasks if t.category in topics and t.status == "done"),
                    sum(1 for t in tasks if t.category in topics),
                ),
            }
            for name, topics in CERTIFICATIONS.items()
        ],
        "by_member": [
            {
                "user_id": m.user_id,
                "username": m.user.username,
                "assigned": sum(1 for t in tasks if t.assignee_id == m.user_id),
                "done": sum(1 for t in tasks if t.assignee_id == m.user_id and t.status == "done"),
            }
            for m in team.members
        ],
    }
