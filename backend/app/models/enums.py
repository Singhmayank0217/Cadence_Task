"""Shared enumerations used by models, schemas and the frontend."""

from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"


class ActivityAction(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    ASSIGNED = "assigned"
    COMMENTED = "commented"
    DELETED = "deleted"


# Ordering helpers used for "sort by priority" queries.
PRIORITY_WEIGHT = {
    TaskPriority.LOW: 1,
    TaskPriority.MEDIUM: 2,
    TaskPriority.HIGH: 3,
    TaskPriority.URGENT: 4,
}

STATUS_WEIGHT = {
    TaskStatus.PENDING: 1,
    TaskStatus.IN_PROGRESS: 2,
    TaskStatus.BLOCKED: 3,
    TaskStatus.COMPLETED: 4,
}

# Display text for anywhere a human reads a value back: the activity trail and
# the CSV export. The frontend keeps its own copy in lib/constants.js.
STATUS_LABELS = {
    TaskStatus.PENDING: "Pending",
    TaskStatus.IN_PROGRESS: "In progress",
    TaskStatus.COMPLETED: "Completed",
    TaskStatus.BLOCKED: "Blocked",
}

PRIORITY_LABELS = {
    TaskPriority.LOW: "Low",
    TaskPriority.MEDIUM: "Medium",
    TaskPriority.HIGH: "High",
    TaskPriority.URGENT: "Urgent",
}
