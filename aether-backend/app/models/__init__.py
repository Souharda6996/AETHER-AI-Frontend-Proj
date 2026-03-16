import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Float, JSON, ARRAY, text
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from ..database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    plan = Column(String, default="starter")
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    settings = Column(JSON, default={})
    api_key_hash = Column(String, nullable=True)
    max_users = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="organization")
    sessions = relationship("Session", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="member")  # admin/member/viewer
    full_name = Column(String)
    avatar_url = Column(String, nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    is_active = Column(Boolean, default=True)
    mfa_secret = Column(String, nullable=True)

    organization = relationship("Organization", back_populates="users")
    sessions = relationship("Session", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    title = Column(String, nullable=True)
    channel = Column(String, default="web")  # web/slack/teams/whatsapp
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), onupdate=datetime.now)
    is_archived = Column(Boolean, default=False)
    metadata_json = Column(JSON, name="metadata", default={})

    user = relationship("User", back_populates="sessions")
    organization = relationship("Organization", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    role = Column(String, nullable=False)  # user/assistant/system/tool
    content = Column(String, nullable=False)
    tokens_used = Column(Integer, default=0)
    agents_invoked = Column(ARRAY(String), default=[])
    tool_calls = Column(JSON, nullable=True)
    latency_ms = Column(Integer, default=0)
    confidence = Column(Float, default=1.0)
    safety_flags = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    session = relationship("Session", back_populates="messages")

class MemoryChunk(Base):
    __tablename__ = "memory_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    content = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    qdrant_id = Column(UUID(as_uuid=True), nullable=True)
    turn_range = Column(ARRAY(Integer))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    minio_path = Column(String, nullable=False)
    size_bytes = Column(Integer)
    mime_type = Column(String)
    chunk_count = Column(Integer, default=0)
    is_indexed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)
    payload = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    user = relationship("User", back_populates="audit_logs")
