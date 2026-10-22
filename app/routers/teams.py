from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_current_user, get_db, get_team_as_member, get_team_as_owner

router = APIRouter(prefix="/teams", tags=["Teams"])


def _team_out(team: models.Team, role: str) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "owner_id": team.owner_id,
        "created_at": team.created_at,
        "members_count": len(team.members),
        "my_role": role,
    }


def _member_out(m: models.TeamMember) -> dict:
    return {
        "user_id": m.user_id,
        "username": m.user.username,
        "email": m.user.email,
        "role": m.role,
        "joined_at": m.joined_at,
    }


@router.get("", response_model=list[schemas.TeamOut])
def list_teams(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    memberships = db.scalars(
        select(models.TeamMember).where(models.TeamMember.user_id == user.id).order_by(models.TeamMember.team_id)
    ).all()
    return [_team_out(m.team, m.role) for m in memberships]


@router.post("", response_model=schemas.TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: schemas.TeamCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    team = models.Team(name=payload.name.strip(), description=payload.description, owner_id=user.id)
    team.members.append(models.TeamMember(user_id=user.id, role="owner"))
    db.add(team)
    db.commit()
    return _team_out(team, "owner")


@router.get("/{team_id}", response_model=schemas.TeamDetail)
def get_team(team_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    team, membership = get_team_as_member(db, team_id, user)
    return {
        **_team_out(team, membership.role),
        "members": [_member_out(m) for m in team.members],
        "tasks_count": len(team.tasks),
    }


@router.put("/{team_id}", response_model=schemas.TeamOut)
def update_team(
    team_id: int,
    payload: schemas.TeamUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    team = get_team_as_owner(db, team_id, user)
    if payload.name is not None:
        team.name = payload.name.strip()
    if payload.description is not None:
        team.description = payload.description
    db.commit()
    return _team_out(team, "owner")


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    team = get_team_as_owner(db, team_id, user)
    db.delete(team)  # members and tasks are removed by the ORM cascade
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{team_id}/members", response_model=schemas.MemberOut, status_code=status.HTTP_201_CREATED)
def add_member(
    team_id: int,
    payload: schemas.MemberAdd,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    get_team_as_owner(db, team_id, user)
    invited = db.scalar(select(models.User).where(models.User.email == payload.email.strip().lower()))
    if invited is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No user with this email")
    if db.get(models.TeamMember, (team_id, invited.id)):
        raise HTTPException(status.HTTP_409_CONFLICT, "User is already a team member")
    member = models.TeamMember(team_id=team_id, user_id=invited.id, role="member")
    db.add(member)
    db.commit()
    return _member_out(member)


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    team_id: int, user_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)
):
    team, membership = get_team_as_member(db, team_id, user)
    if user_id != user.id and membership.role != "owner":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the team owner can remove other members")
    target = db.get(models.TeamMember, (team_id, user_id))
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found in this team")
    if target.role == "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The owner cannot leave; delete the team instead")
    # tasks assigned to the removed user become unassigned
    db.execute(
        update(models.Task)
        .where(models.Task.team_id == team_id, models.Task.assignee_id == user_id)
        .values(assignee_id=None)
    )
    db.delete(target)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
