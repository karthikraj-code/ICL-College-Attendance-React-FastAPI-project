import time
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _database_url() -> str:
    password = quote_plus(settings.DB_PASSWORD)
    return (
        f"mysql+pymysql://{settings.DB_USER}:{password}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )


engine = create_engine(_database_url(), pool_pre_ping=True, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def wait_for_db(retries: int = 30, delay_seconds: int = 2) -> None:
    """MySQL in Docker often needs a few seconds after the container starts.

    Retry instead of crashing permanently on the first failed connection.
    """
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except Exception as error:  # noqa: BLE001 — wait for any connect failure
            last_error = error
            time.sleep(delay_seconds)
            print(f"Waiting for MySQL ({settings.DB_HOST}:{settings.DB_PORT}) attempt {attempt}/{retries}")
    raise RuntimeError(
        f"Could not connect to MySQL at {settings.DB_HOST}:{settings.DB_PORT}. Last error: {last_error}"
    )
