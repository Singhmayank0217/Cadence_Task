"""Password hashing and JWT helpers.

Uses PBKDF2-HMAC-SHA256 from the standard library so the project has no
compiled crypto dependencies to install.
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import jwt

from app.core.config import settings

_ALGORITHM = "sha256"
_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Return a `pbkdf2$iterations$salt$hash` string."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(_ALGORITHM, password.encode(), salt, _ITERATIONS)
    return f"pbkdf2${_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time verification of a password against a stored hash."""
    try:
        scheme, iterations, salt_hex, digest_hex = stored.split("$")
        if scheme != "pbkdf2":
            return False
        expected = hashlib.pbkdf2_hmac(
            _ALGORITHM, password.encode(), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, AttributeError):
        return False


def create_access_token(
    subject: str | int, extra_claims: Optional[Dict[str, Any]] = None
) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Return the decoded payload, or None when the token is invalid/expired."""
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.PyJWTError:
        return None
