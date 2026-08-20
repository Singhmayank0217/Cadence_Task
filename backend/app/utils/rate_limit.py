"""A tiny in-process token bucket.

Used to keep our own outbound calls inside a third-party API's published rate
limit. For multi-process deployments this would be backed by Redis - the
interface stays the same.
"""

import threading
import time
from dataclasses import dataclass


@dataclass
class TokenBucket:
    capacity: int
    refill_per_second: float

    def __post_init__(self) -> None:
        self._tokens = float(self.capacity)
        self._updated = time.monotonic()
        self._lock = threading.Lock()

    def _refill(self) -> None:
        now = time.monotonic()
        elapsed = now - self._updated
        self._tokens = min(self.capacity, self._tokens + elapsed * self.refill_per_second)
        self._updated = now

    def try_acquire(self, tokens: int = 1) -> bool:
        with self._lock:
            self._refill()
            if self._tokens >= tokens:
                self._tokens -= tokens
                return True
            return False

    def retry_after(self) -> float:
        """Seconds until at least one token is available."""
        with self._lock:
            self._refill()
            if self._tokens >= 1:
                return 0.0
            return round((1 - self._tokens) / self.refill_per_second, 2)


def per_minute(calls: int) -> TokenBucket:
    return TokenBucket(capacity=calls, refill_per_second=calls / 60.0)
