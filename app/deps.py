from collections.abc import Iterator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .database import SessionLocal
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED, "Not authenticated", headers={"WWW-Authenticate": "Bearer"}
    )
    if creds is None:
        raise unauthorized
    try:
        user_id = decode_access_token(creds.credentials)
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"}
        )
    user = db.get(models.User, user_id)
    if user is None:
        raise unauthorized
    return user


def get_team_as_member(db: Session, team_id: int, user: models.User) -> tuple[models.Team, models.TeamMember]:
    """404 if the team does not exist, 403 if the user is not in it."""
    team = db.get(models.Team, team_id)
    if team is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team not found")
    membership = db.get(models.TeamMember, (team_id, user.id))
    if membership is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not a member of this team")
    return team, membership


def get_team_as_owner(db: Session, team_id: int, user: models.User) -> models.Team:
    team, membership = get_team_as_member(db, team_id, user)
    if membership.role != "owner":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the team owner can do this")
    return team
