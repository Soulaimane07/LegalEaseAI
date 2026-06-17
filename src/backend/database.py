"""Local SQLite persistence layer (replaces Cloud Firestore).

100% free, no credit card, no cloud account. The database is a single file
(`legalease.db`) stored next to this module. Swappable later for PostgreSQL by
changing SQLALCHEMY_DATABASE_URL only — the rest of the code stays identical.
"""
import os
import datetime

from sqlalchemy import create_engine, Column, String, DateTime, JSON, Text, Integer
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.path.join(os.path.dirname(__file__), "legalease.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # Required so FastAPI's threadpool can share the SQLite connection.
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, default="New Legal Consultation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # List of {"role", "content", "timestamp"} dicts (mirrors the old Firestore array).
    messages = Column(JSON, default=list)


class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    filename = Column(String)
    stored_filename = Column(String)
    file_path = Column(String)
    status = Column(String, default="uploaded")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class User(Base):
    """Subscription profile for a Firebase user (ported from the colleague's
    Firestore 'users' collection to local SQLite)."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Firebase uid
    plan = Column(String, default="freemium")          # freemium | premium | subscribed
    analyses_used = Column(Integer, default=0)          # free contract analyses consumed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class ChatDocument(Base):
    """A document the user attached to a conversation to chat about it.
    We store the extracted text so each question can be grounded on it."""
    __tablename__ = "chat_documents"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    filename = Column(String)
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    """Create tables on first run (no-op if they already exist)."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a scoped DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
