"""Demo data so the app is useful the moment it boots.

Run automatically on startup (SEED_ON_STARTUP=true) or manually:

    python -m app.db.seed          # seed if empty
    python -m app.db.seed --reset  # drop everything and reseed

The data models a small product studio: client delivery work, platform
maintenance and internal operations, spread across the team so the dashboard
shows a realistic mix of late, blocked and healthy work on first load.
"""

import random
import sys
from datetime import timedelta

from sqlalchemy import select

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import Activity, Comment, Task, User
from app.models.enums import (
    PRIORITY_LABELS,
    STATUS_LABELS,
    ActivityAction,
    TaskPriority,
    TaskStatus,
    UserRole,
)
from app.utils.datetime_utils import utcnow

# Avatars are drawn from the person's initials in the frontend, so there is no
# third-party image host in the critical path and the app looks correct offline.
TEAM = [
    ("Mayank Singh", "mayank@cadence.dev", UserRole.ADMIN, "Engineering Manager"),
    ("Rahul Verma", "rahul@cadence.dev", UserRole.MANAGER, "Delivery Lead"),
    ("Janvi Mehta", "janvi@cadence.dev", UserRole.MANAGER, "Product Designer"),
    ("Aditi Rao", "aditi@cadence.dev", UserRole.MEMBER, "Frontend Engineer"),
    ("Karan Malhotra", "karan@cadence.dev", UserRole.MEMBER, "Backend Engineer"),
    ("Simran Kaur", "simran@cadence.dev", UserRole.MEMBER, "QA Engineer"),
    ("Devansh Patel", "devansh@cadence.dev", UserRole.MEMBER, "Infrastructure"),
    ("Neha Gupta", "neha@cadence.dev", UserRole.MEMBER, "Business Analyst"),
]

# (title, description, status, priority, assignee index, due offset in days)
TASKS = [
    (
        "Shopify order sync drops orders during flash sales",
        "Meridian Home reported 40+ missing orders on the Diwali sale. The poller "
        "times out under load. Move to webhook topics, verify the HMAC signature "
        "and hold failures in a replay queue instead of dropping them.",
        TaskStatus.IN_PROGRESS, TaskPriority.URGENT, 4, 2,
    ),
    (
        "Meridian Home: migrate storefront to Shopify Dawn 3",
        "The theme is three majors behind so we cannot ship the new product page. "
        "Port the custom sections first, then the cart drawer. Keep the existing "
        "metafield names so the merchandising team is not retrained.",
        TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 3, 6,
    ),
    (
        "Cut the Q3 invoice reconciliation report",
        "Finance needs billed hours per client against the retainer. Pull from the "
        "timesheet export and flag anyone over 90% of their block.",
        TaskStatus.PENDING, TaskPriority.HIGH, 7, 3,
    ),
    (
        "Payment webhook retries are firing twice",
        "Razorpay sends a duplicate on timeout and we create two payment rows. Key "
        "the handler on the event id and make the write idempotent.",
        TaskStatus.BLOCKED, TaskPriority.URGENT, 4, -1,
    ),
    (
        "Design review: warehouse scanner screens",
        "Handheld screens for Meridian's packing floor. Large tap targets, usable "
        "with gloves, readable under warehouse lighting. Bring two directions.",
        TaskStatus.PENDING, TaskPriority.MEDIUM, 2, 4,
    ),
    (
        "Rotate the production database credentials",
        "Quarterly rotation is overdue. Stage the new secret, roll the app pods, "
        "then revoke the old one. Needs a maintenance window agreed with Rahul.",
        TaskStatus.PENDING, TaskPriority.HIGH, 6, -3,
    ),
    (
        "Search returns nothing for hyphenated product names",
        "\"Slow-brew kettle\" returns zero results but \"slow brew kettle\" works. "
        "The tokeniser splits on the hyphen at index time and not at query time. "
        "Reported by two clients now.",
        TaskStatus.PENDING, TaskPriority.HIGH, 4, 1,
    ),
    (
        "Onboard Northlight Retail to the staging environment",
        "Kickoff is on the 4th. Provision the tenant, load their catalogue sample, "
        "and set up read-only logins for their team.",
        TaskStatus.PENDING, TaskPriority.MEDIUM, 1, 9,
    ),
    (
        "Accessibility pass on the checkout flow",
        "Keyboard trap in the address autocomplete and the error summary is never "
        "announced. Target WCAG 2.1 AA before the client's own audit in November.",
        TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 5, 5,
    ),
    (
        "Cost review: staging cluster runs around the clock",
        "Staging now costs more than production. Scale the node group to zero "
        "outside 9-7 on weekdays and shut it down entirely at weekends.",
        TaskStatus.PENDING, TaskPriority.MEDIUM, 6, 12,
    ),
    (
        "Write the incident postmortem for the 14 August outage",
        "Two hours of failed checkouts after the CDN config push. Timeline, root "
        "cause, and the two guardrails we agreed. Circulate before Friday.",
        TaskStatus.PENDING, TaskPriority.HIGH, 0, 2,
    ),
    (
        "Regression suite for the returns flow",
        "Cover partial returns, exchanges and refunds to store credit. All three "
        "are manual today and we keep shipping bugs in them.",
        TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, 5, 8,
    ),
    (
        "Meridian Home: agree the September retainer scope",
        "Confirm what fits in the 60 hours. They want the loyalty widget and the "
        "returns portal and both will not fit. Get a written priority call.",
        TaskStatus.PENDING, TaskPriority.MEDIUM, 1, 7,
    ),
    (
        "Product images load at full resolution on mobile",
        "A 3.2 MB hero image on a phone. Wire up responsive srcset and serve WebP "
        "with a JPEG fallback. Biggest single win on the performance report.",
        TaskStatus.COMPLETED, TaskPriority.HIGH, 3, -5,
    ),
    (
        "Nightly backup restore drill",
        "We take backups but have never restored one. Restore last night's dump to "
        "a throwaway instance and time the whole thing.",
        TaskStatus.PENDING, TaskPriority.HIGH, 6, 14,
    ),
    (
        "Stock levels drift after bulk imports",
        "The CSV import writes stock without taking the row lock, so concurrent "
        "imports overwrite each other. The warehouse has stopped trusting the "
        "number on screen.",
        TaskStatus.BLOCKED, TaskPriority.URGENT, 4, -2,
    ),
    (
        "Interview loop for the second QA hire",
        "Three candidates through to the practical. Book the panel and prepare the "
        "exercise brief so everyone marks against the same rubric.",
        TaskStatus.PENDING, TaskPriority.MEDIUM, 0, 6,
    ),
    (
        "Standardise error responses across the API",
        "Three different error shapes depending on which route you hit. Settle on "
        "one envelope and update the client wrapper to match.",
        TaskStatus.COMPLETED, TaskPriority.MEDIUM, 4, -8,
    ),
    (
        "Northlight Retail: data migration mapping",
        "Map their legacy product fields onto ours. Two of their attributes have "
        "no home yet, so we need a decision on custom fields before the import.",
        TaskStatus.PENDING, TaskPriority.HIGH, 7, 10,
    ),
    (
        "Email templates break in Outlook",
        "Order confirmations lose their layout in Outlook 2019. Move the buttons "
        "to table-based markup and test across the usual clients.",
        TaskStatus.PENDING, TaskPriority.LOW, 2, 16,
    ),
    (
        "Move the vendor portal off the shared login",
        "Six suppliers share one account, so we cannot tell who changed a price. "
        "Individual logins with an audit trail on every price edit.",
        TaskStatus.PENDING, TaskPriority.HIGH, 4, 18,
    ),
    (
        "Quarterly access review",
        "Two contractors rolled off in July and still have repository access. Walk "
        "every system, revoke what should be gone, and record the result.",
        TaskStatus.IN_PROGRESS, TaskPriority.URGENT, 6, 0,
    ),
    (
        "Draft the case study for the Meridian rebuild",
        "Before and after numbers, the migration approach, and a quote from their "
        "ops lead. Marketing wants it for the site refresh.",
        TaskStatus.PENDING, TaskPriority.LOW, 7, 21,
    ),
    (
        "Slow dashboard for accounts with 10k+ orders",
        "The summary panel runs one query per widget. Roll it into a single grouped "
        "query and add an index on (account_id, created_at).",
        TaskStatus.COMPLETED, TaskPriority.HIGH, 4, -4,
    ),
    (
        "Set up uptime alerting that reaches a person",
        "Alerts go to an inbox nobody watches at night. Route to the on-call phone "
        "with an escalation after ten minutes.",
        TaskStatus.PENDING, TaskPriority.URGENT, 6, 4,
    ),
    (
        "Client training session: content editing",
        "Two hours with Meridian's marketing team on the new page builder. Record "
        "it so new joiners are not a repeat session.",
        TaskStatus.COMPLETED, TaskPriority.LOW, 2, -7,
    ),
    (
        "Discount codes stack when they should not",
        "Two percentage codes can be applied together and take an order below cost. "
        "Enforce exclusivity server-side, not just in the cart UI.",
        TaskStatus.IN_PROGRESS, TaskPriority.HIGH, 3, 3,
    ),
    (
        "Archive projects closed before January",
        "The project list carries three years of finished work. Archive rather than "
        "delete, and keep them searchable.",
        TaskStatus.PENDING, TaskPriority.LOW, 1, 25,
    ),
    (
        "Renew the SSL certificate for the client portal",
        "Expires on the 28th. Auto-renewal failed last time on the DNS challenge, "
        "so do it by hand and then fix the automation.",
        TaskStatus.PENDING, TaskPriority.URGENT, 6, 9,
    ),
    (
        "Timezone drift on scheduled reports",
        "Reports scheduled for 9am arrive at 2:30pm for the UK client. We store "
        "local time and compare in UTC. Store UTC and render local.",
        TaskStatus.COMPLETED, TaskPriority.MEDIUM, 4, -10,
    ),
]

# Unassigned work, so the "unassigned" filter has something real to show.
UNCLAIMED = [
    (
        "Triage the support inbox backlog",
        "About sixty unread tickets since the sale. Someone needs to sort real bugs "
        "from questions before standup.",
        TaskPriority.MEDIUM, 3,
    ),
    (
        "Second opinion on the reporting database choice",
        "Read replica versus a separate warehouse. Whoever picks this up should "
        "come back with a recommendation, not a list of options.",
        TaskPriority.LOW, 11,
    ),
]

COMMENTS = [
    "Reproduced on staging with the same payload. Logs are attached to the ticket.",
    "Blocked until the client confirms which of the two they want first.",
    "Picked this up this morning, should have something to look at by tomorrow.",
    "Pushed a fix to the branch. Worth a second pair of eyes on the retry logic.",
    "Pulled the numbers: it is about 12% of orders, not the 2% we assumed.",
    "Moved the due date out a week, the dependency landed later than planned.",
    "Ran it past Rahul, we are fine to proceed without a formal sign-off.",
    "Adding a regression test so this cannot come back quietly.",
    "Estimate still holds at two days. Will flag here if that changes.",
    "The client has seen the draft and is happy. Closing this once it ships.",
]


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    random.seed(11)
    try:
        if db.execute(select(User.id)).first() and not reset:
            print("Database already has data - skipping seed.")
            return

        users = []
        for name, email, role, title in TEAM:
            user = User(
                name=name,
                email=email,
                role=role,
                job_title=title,
                avatar_url=None,
                hashed_password=hash_password(settings.DEFAULT_PASSWORD),
            )
            db.add(user)
            users.append(user)
        db.flush()

        now = utcnow()
        tasks = []
        for index, (title, description, status, priority, assignee_idx, due_offset) in enumerate(
            TASKS
        ):
            created_at = now - timedelta(days=random.randint(2, 40), hours=random.randint(0, 20))
            task = Task(
                title=title,
                description=description,
                status=status,
                priority=priority,
                assigned_to=users[assignee_idx].id,
                created_by=users[index % 3].id,
                due_date=now + timedelta(days=due_offset, hours=9),
                created_at=created_at,
                updated_at=created_at + timedelta(hours=random.randint(1, 60)),
                completed_at=(now - timedelta(days=abs(due_offset)))
                if status == TaskStatus.COMPLETED
                else None,
            )
            db.add(task)
            tasks.append(task)

        for title, description, priority, due_offset in UNCLAIMED:
            created_at = now - timedelta(days=random.randint(1, 6))
            task = Task(
                title=title,
                description=description,
                status=TaskStatus.PENDING,
                priority=priority,
                assigned_to=None,
                created_by=users[0].id,
                due_date=now + timedelta(days=due_offset, hours=9),
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(task)
            tasks.append(task)
        db.flush()

        for task in tasks:
            db.add(
                Activity(
                    task_id=task.id,
                    user_id=task.created_by,
                    action=ActivityAction.CREATED,
                    new_value=task.title,
                    created_at=task.created_at,
                )
            )
            if task.assigned_to:
                assignee = next(u for u in users if u.id == task.assigned_to)
                db.add(
                    Activity(
                        task_id=task.id,
                        user_id=task.created_by,
                        action=ActivityAction.ASSIGNED,
                        field="assigned_to",
                        new_value=assignee.name,
                        created_at=task.created_at + timedelta(minutes=4),
                    )
                )
            if task.status != TaskStatus.PENDING:
                db.add(
                    Activity(
                        task_id=task.id,
                        user_id=task.assigned_to,
                        action=ActivityAction.STATUS_CHANGED,
                        field="status",
                        old_value=STATUS_LABELS[TaskStatus.PENDING],
                        new_value=STATUS_LABELS[task.status],
                        created_at=task.updated_at,
                    )
                )
            if task.priority in (TaskPriority.URGENT, TaskPriority.HIGH) and random.random() < 0.4:
                db.add(
                    Activity(
                        task_id=task.id,
                        user_id=users[0].id,
                        action=ActivityAction.PRIORITY_CHANGED,
                        field="priority",
                        old_value=PRIORITY_LABELS[TaskPriority.MEDIUM],
                        new_value=PRIORITY_LABELS[task.priority],
                        created_at=task.updated_at + timedelta(hours=2),
                    )
                )

            for offset in range(random.randint(0, 3)):
                author = random.choice(users)
                db.add(
                    Comment(
                        task_id=task.id,
                        user_id=author.id,
                        comment=random.choice(COMMENTS),
                        created_at=task.created_at + timedelta(days=offset + 1, hours=3),
                    )
                )

        db.commit()
        print(f"Seeded {len(users)} team members and {len(tasks)} tasks.")
        print(f"Sign in with mayank@cadence.dev / {settings.DEFAULT_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
