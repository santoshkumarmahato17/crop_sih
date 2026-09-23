import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """Verify a plaintext password against a stored bcrypt hash safely."""
    if not plain_password or not hashed_password or not isinstance(hashed_password, str):
        return False
    # Validate bcrypt format ($2a$, $2b$, or $2y$ prefix and minimum length 59)
    clean_hash = hashed_password.strip()
    if len(clean_hash) < 59 or not (clean_hash.startswith("$2a$") or clean_hash.startswith("$2b$") or clean_hash.startswith("$2y$")):
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            clean_hash.encode("utf-8"),
        )
    except Exception:
        return False



def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash from a plaintext password."""
    # Truncate to 72 bytes as per bcrypt specification
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generates a short-lived signed JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "email": email,
        "role": role.upper(),
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(
    subject: Union[str, Any],
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generates a long-lived signed JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "email": email,
        "role": role.upper(),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT token string."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None
