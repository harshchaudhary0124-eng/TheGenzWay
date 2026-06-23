#!/usr/bin/env python3
"""
One-time sync script: reads onboarding_answers from the users table and
populates the user_onboarding table for every user who has already completed
onboarding.  Safe to run multiple times — existing rows are skipped.

Usage:
    cd backend
    python sync_onboarding.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, Base, SessionLocal
from app.models import User, UserOnboarding  # noqa: ensures both tables exist

# Create any missing tables (user_onboarding may be new)
Base.metadata.create_all(bind=engine)


def sync() -> None:
    db = SessionLocal()
    synced = skipped = failed = 0

    try:
        users_done = (
            db.query(User)
            .filter(User.onboarding_completed == True)  # noqa: E712
            .order_by(User.id)
            .all()
        )

        total = len(users_done)
        print(f"\nFound {total} user(s) with onboarding_completed = True\n")

        for user in users_done:
            # Already has a row -> skip
            exists = (
                db.query(UserOnboarding)
                .filter(UserOnboarding.user_id == user.id)
                .first()
            )
            if exists:
                print(f"  SKIP  id={user.id:<4}  {user.full_name!r:30}  (already in user_onboarding)")
                skipped += 1
                continue

            # Pull answers from the JSON blob on users row
            oa     = user.onboarding_answers or {}
            domain = oa.get("domain", "")
            raw    = oa.get("answers", {})

            if not domain or not isinstance(raw, dict) or not raw:
                print(f"  WARN  id={user.id:<4}  {user.full_name!r:30}  missing/empty onboarding_answers -- skipped")
                failed += 1
                continue

            av = list(raw.values())

            db.add(UserOnboarding(
                user_id   = user.id,
                full_name = user.full_name,
                domain    = domain,
                answer_1  = av[0] if len(av) > 0 else "",
                answer_2  = av[1] if len(av) > 1 else "",
                answer_3  = av[2] if len(av) > 2 else "",
                answer_4  = av[3] if len(av) > 3 else "",
            ))
            synced += 1
            print(f"  SYNC  id={user.id:<4}  {user.full_name!r:30}  domain={domain!r}")

        db.commit()

    except Exception as exc:
        db.rollback()
        print(f"\nERROR: {exc}")
        raise
    finally:
        db.close()

    print(f"""
--- Summary ---
  Synced  : {synced}
  Skipped : {skipped}  (row already existed)
  Failed  : {failed}  (missing data in onboarding_answers)
  Total   : {total}
""")


if __name__ == "__main__":
    sync()
