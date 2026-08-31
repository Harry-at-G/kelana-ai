from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(BigInteger, primary_key=True)
    name          = Column(String(100),  nullable=False)
    email         = Column(String(255),  nullable=False, unique=True)
    password_hash = Column(String(255),  nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
