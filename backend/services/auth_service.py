import os
import datetime
import bcrypt
import jwt

from dotenv import load_dotenv
from database import SessionLocal
from models.user import User

load_dotenv()

_JWT_SECRET  = os.getenv("JWT_SECRET", "Fdom7cghXkotoVh4pcaPbrpc6nr3beB4uj9csIqYgrb")
_JWT_EXPIRY  = int(os.getenv("JWT_EXPIRY_HOURS", "1"))
_JWT_ALGO    = "HS256"


def create_token(user: User) -> str:
    """Create a signed JWT containing the user's id, name and email."""
    payload = {
        "sub":   str(user.id),
        "name":  user.name,
        "email": user.email,
        "exp":   datetime.datetime.utcnow() + datetime.timedelta(hours=_JWT_EXPIRY),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm=_JWT_ALGO)


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT. Returns the payload dict.

    Raises:
        jwt.ExpiredSignatureError: token has expired.
        jwt.InvalidTokenError: token is invalid.
    """
    return jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGO])


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plain-text password against a stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8")
    )


def register_user(name: str, email: str, password: str) -> User:
    """
    Create a new user record.

    Raises:
        ValueError: if the email is already registered.
    """
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            name          = name,
            email         = email,
            password_hash = hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def login_user(email: str, password: str) -> User:
    """
    Verify credentials and return the User.

    Raises:
        ValueError: if email not found or password is wrong.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")
        return user
    finally:
        db.close()
