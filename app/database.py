import time

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from . import config

_connect_args = {"check_same_thread": False} if config.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(config.DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def init_db(retries: int = 30, delay: float = 1.0) -> None:
    """Create tables. Retries so the API survives starting before Postgres is ready."""
    from . import models  # noqa: F401  (registers tables on Base.metadata)

    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            print(f"[db] not ready (attempt {attempt}/{retries}), retrying...", flush=True)
            time.sleep(delay)
    raise RuntimeError("Database is not reachable")
