"""Thread-safe TTL cache for third-party responses."""

import threading
import time
from typing import Any, Dict, Optional, Tuple


class TTLCache:
    def __init__(self, ttl_seconds: int = 300):
        self.ttl = ttl_seconds
        self._store: Dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if not entry:
                return None
            expires_at, value = entry
            if expires_at < time.time():
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (time.time() + self.ttl, value)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()
